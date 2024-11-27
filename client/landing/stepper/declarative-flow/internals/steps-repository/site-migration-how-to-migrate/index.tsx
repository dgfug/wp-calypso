import { useHasEnTranslation } from '@automattic/i18n-utils';
import { StepContainer } from '@automattic/onboarding';
import { useTranslate } from 'i18n-calypso';
import { FC, useCallback, useMemo } from 'react';
import DocumentHead from 'calypso/components/data/document-head';
import FormattedHeader from 'calypso/components/formatted-header';
import { useMigrationCancellation } from 'calypso/data/site-migration/landing/use-migration-cancellation';
import { useAnalyzeUrlQuery } from 'calypso/data/site-profiler/use-analyze-url-query';
import { useHostingProviderQuery } from 'calypso/data/site-profiler/use-hosting-provider-query';
import { HOW_TO_MIGRATE_OPTIONS } from 'calypso/landing/stepper/constants';
import { useQuery } from 'calypso/landing/stepper/hooks/use-query';
import { useSite } from 'calypso/landing/stepper/hooks/use-site';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { usePresalesChat } from 'calypso/lib/presales-chat';
import useHostingProviderName from 'calypso/site-profiler/hooks/use-hosting-provider-name';
import FlowCard from '../components/flow-card';
import type { StepProps } from '../../types';
import './style.scss';

interface Props extends StepProps {
	headerText?: string;
	subHeaderText?: string;
}

const SiteMigrationHowToMigrate: FC< Props > = ( props ) => {
	const { navigation, headerText } = props;

	const translate = useTranslate();
	const importSiteQueryParam = useQuery().get( 'from' ) || '';
	const site = useSite();
	const { mutate: cancelMigration } = useMigrationCancellation( site?.ID );

	usePresalesChat( 'wpcom' );

	const hasEnTranslation = useHasEnTranslation();

	const options = useMemo(
		() => [
			{
				label: translate( 'Do it for me' ),
				description: hasEnTranslation(
					"Share your site with us. We'll review it and handle the migration if possible."
				)
					? translate(
							"Share your site with us. We'll review it and handle the migration if possible."
					  )
					: translate(
							"Share your site with us, and we'll review it and handle the migration if possible."
					  ),
				value: HOW_TO_MIGRATE_OPTIONS.DO_IT_FOR_ME,
				selected: true,
			},
			{
				label: translate( "I'll do it myself" ),
				description: translate(
					'Install the plugin yourself, find the migration key and migrate the site.'
				),
				value: HOW_TO_MIGRATE_OPTIONS.DO_IT_MYSELF,
			},
		],
		[ translate ]
	);

	let importSiteHostName = '';

	try {
		importSiteHostName = new URL( importSiteQueryParam )?.hostname;
	} catch ( e ) {}

	const { data: urlData } = useAnalyzeUrlQuery( importSiteQueryParam, true );
	const { data: hostingProviderData } = useHostingProviderQuery( importSiteHostName, true );
	const hostingProviderName = useHostingProviderName(
		hostingProviderData?.hosting_provider,
		urlData
	);

	const handleClick = async ( value: string ) => {
		const canInstallPlugins = site?.plan?.features?.active.find(
			( feature ) => feature === 'install-plugins'
		)
			? true
			: false;

		const destination = canInstallPlugins ? 'migrate' : 'upgrade';

		if ( navigation.submit ) {
			return navigation.submit( { how: value, destination } );
		}
	};

	const hostingProviderSlug = hostingProviderData?.hosting_provider?.slug;
	const shouldDisplayHostIdentificationMessage =
		hostingProviderSlug &&
		hostingProviderSlug !== 'unknown' &&
		hostingProviderSlug !== 'automattic';

	const stepContent = (
		<div className="how-to-migrate__list">
			{ options.map( ( option, i ) => (
				<FlowCard
					key={ i }
					title={ option.label }
					text={ option.description }
					onClick={ () => handleClick( option.value ) }
				/>
			) ) }
		</div>
	);

	const platformText = shouldDisplayHostIdentificationMessage
		? translate( 'Your WordPress site is hosted with %(hostingProviderName)s.', {
				args: { hostingProviderName },
		  } )
		: '';

	const goBack = useCallback( () => {
		cancelMigration();
		navigation.goBack?.();
	}, [ cancelMigration, navigation ] );

	return (
		<>
			<DocumentHead title={ translate( 'How do you want to migrate?' ) } />
			<StepContainer
				stepName={ props.stepName ?? 'site-migration-how-to-migrate' }
				className="how-to-migrate"
				shouldHideNavButtons={ false }
				hideSkip
				formattedHeader={
					<FormattedHeader
						id="how-to-migrate-header"
						headerText={ headerText ?? translate( 'How do you want to migrate?' ) }
						subHeaderText={ props.subHeaderText || platformText }
						align="center"
					/>
				}
				stepContent={ stepContent }
				recordTracksEvent={ recordTracksEvent }
				goBack={ goBack }
			/>
		</>
	);
};

export default SiteMigrationHowToMigrate;
