import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import { useOdieAssistantContext } from '../../context';
import { useCreateZendeskConversation } from '../../hooks';
import { getHelpCenterZendeskConversationStarted } from '../../utils';

export const DirectEscalationLink = ( { messageId }: { messageId: number | undefined } ) => {
	const conversationStarted = Boolean( getHelpCenterZendeskConversationStarted() );
	const newConversation = useCreateZendeskConversation();
	const { shouldUseHelpCenterExperience, trackEvent, isUserEligibleForPaidSupport } =
		useOdieAssistantContext();
	const navigate = useNavigate();

	const disclaimerText = shouldUseHelpCenterExperience
		? __( 'Feeling stuck?', __i18n_text_domain__ )
		: __( 'Did you find the answer to your question?', __i18n_text_domain__ );
	const handleClick = useCallback( () => {
		trackEvent( 'chat_message_direct_escalation_link_click', {
			message_id: messageId,
			is_user_eligible_for_paid_support: isUserEligibleForPaidSupport,
		} );

		if ( isUserEligibleForPaidSupport ) {
			if ( shouldUseHelpCenterExperience ) {
				if ( conversationStarted ) {
					return;
				}
				newConversation();
			} else {
				navigate( '/contact-options' );
			}
		} else {
			navigate( '/contact-form?mode=FORUM' );
		}
	}, [
		trackEvent,
		messageId,
		isUserEligibleForPaidSupport,
		shouldUseHelpCenterExperience,
		conversationStarted,
		newConversation,
		navigate,
	] );

	return (
		<div className="disclaimer">
			{ disclaimerText }{ ' ' }
			<button onClick={ handleClick } className="odie-button-link" disabled={ conversationStarted }>
				{ isUserEligibleForPaidSupport
					? __( 'Contact our support team.', __i18n_text_domain__ )
					: __( 'Ask in our forums.', __i18n_text_domain__ ) }
			</button>
		</div>
	);
};
