import page from '@automattic/calypso-router';
import { useDebouncedInput } from '@wordpress/compose';
import { translate } from 'i18n-calypso';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import InlineSupportLink from 'calypso/components/inline-support-link';
import NavigationHeader from 'calypso/components/navigation-header';
import { useUrlBasicMetricsQuery } from 'calypso/data/site-profiler/use-url-basic-metrics-query';
import { useUrlPerformanceInsightsQuery } from 'calypso/data/site-profiler/use-url-performance-insights';
import { useDispatch, useSelector } from 'calypso/state';
import getCurrentQueryArguments from 'calypso/state/selectors/get-current-query-arguments';
import { requestSiteStats } from 'calypso/state/stats/lists/actions';
import { getSiteStatsNormalizedData } from 'calypso/state/stats/lists/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import { PageSelector } from './components/PageSelector';
import { PerformanceReport } from './components/PerformanceReport';
import { DeviceTabControls, Tab } from './components/device-tab-control';
import { useSitePages } from './hooks/useSitePages';

import './style.scss';

const statType = 'statsTopPosts';

const statsQuery = {
	num: -1,
	summarize: 1,
	period: 'day',
	date: moment().format( 'YYYY-MM-DD' ),
	max: 0,
};

const usePerformanceReport = (
	wpcom_performance_url: { url: string; hash: string } | undefined,
	activeTab: Tab
) => {
	const { url = '', hash = '' } = wpcom_performance_url || {};

	const { data: basicMetrics } = useUrlBasicMetricsQuery( url, hash, true );
	const { final_url: finalUrl } = basicMetrics || {};
	const { data: performanceInsights } = useUrlPerformanceInsightsQuery( url, hash );

	const mobileReport =
		typeof performanceInsights?.mobile === 'string' ? undefined : performanceInsights?.mobile;
	const desktopReport =
		typeof performanceInsights?.desktop === 'string' ? undefined : performanceInsights?.desktop;

	const performanceReport = activeTab === 'mobile' ? mobileReport : desktopReport;

	const desktopLoaded = 'completed' === performanceInsights?.status;
	const mobileLoaded = typeof performanceInsights?.mobile === 'object';

	return {
		performanceReport,
		url: finalUrl ?? url,
		hash,
		isLoading: activeTab === 'mobile' ? ! mobileLoaded : ! desktopLoaded,
	};
};

export const SitePerformance = () => {
	const [ activeTab, setActiveTab ] = useState< Tab >( 'mobile' );

	const dispatch = useDispatch();
	const siteId = useSelector( getSelectedSiteId );

	const stats = useSelector( ( state ) =>
		getSiteStatsNormalizedData( state, siteId, statType, statsQuery )
	) as { id: number; value: number }[];

	useEffect( () => {
		if ( ! siteId ) {
			return;
		}

		dispatch( requestSiteStats( siteId, statType, statsQuery ) );
	}, [ dispatch, siteId ] );

	const queryParams = useSelector( getCurrentQueryArguments );
	const [ , setQuery, query ] = useDebouncedInput();
	const pages = useSitePages( { query } );

	const orderedPages = useMemo( () => {
		return [ ...pages ].sort( ( a, b ) => {
			const aVisits = stats.find( ( { id } ) => id === parseInt( a.value, 10 ) )?.value ?? 0;
			const bVisits = stats.find( ( { id } ) => id === parseInt( b.value, 10 ) )?.value ?? 0;
			return bVisits - aVisits;
		} );
	}, [ pages, stats ] );

	const currentPageId = queryParams?.page_id?.toString() ?? '0';
	const currentPage = useMemo(
		() => pages.find( ( page ) => page.value === currentPageId ),
		[ pages, currentPageId ]
	);

	const performanceReport = usePerformanceReport( currentPage?.wpcom_performance_url, activeTab );

	return (
		<div className="site-performance">
			<div className="site-performance-device-tab-controls__container">
				<NavigationHeader
					className="site-performance__navigation-header"
					title={ translate( 'Performance' ) }
					subtitle={ translate(
						'Optimize your site for lightning-fast performance. {{link}}Learn more.{{/link}}',
						{
							components: {
								link: <InlineSupportLink supportContext="site-monitoring" showIcon={ false } />,
							},
						}
					) }
				/>
				<PageSelector
					onFilterValueChange={ setQuery }
					options={ orderedPages }
					onChange={ ( page_id ) => {
						const url = new URL( window.location.href );

						if ( page_id ) {
							url.searchParams.set( 'page_id', page_id );
						} else {
							url.searchParams.delete( 'page_id' );
						}

						page.replace( url.pathname + url.search );
					} }
					value={ currentPageId }
				/>
				<DeviceTabControls onDeviceTabChange={ setActiveTab } value={ activeTab } />
			</div>
			{ currentPage && (
				<PerformanceReport { ...performanceReport } pageTitle={ currentPage.label } />
			) }
		</div>
	);
};
