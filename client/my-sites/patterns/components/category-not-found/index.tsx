import { addLocaleToPathLocaleInFront } from '@automattic/i18n-utils';
import { useTranslate } from 'i18n-calypso';
import { useSelector } from 'react-redux';
import EmptyContent from 'calypso/components/empty-content';
import { isUserLoggedIn } from 'calypso/state/current-user/selectors';

import './style.scss';

export const PatternsCategoryNotFound = () => {
	const isLoggedIn = useSelector( isUserLoggedIn );
	const translate_not_yet = useTranslate();

	const comment =
		'Message displayed when an invalid category was specified while searching block patterns';

	return (
		<EmptyContent
			title={ translate_not_yet( "Oops! We can't find this category!", { comment } ) }
			line={ translate_not_yet( "The category you are looking for doesn't exist.", { comment } ) }
			action={ translate_not_yet( 'Browse all patterns', { comment } ) }
			actionURL={ isLoggedIn ? '/patterns' : addLocaleToPathLocaleInFront( '/patterns' ) }
			illustration="/calypso/images/illustrations/illustration-404.svg"
		/>
	);
};