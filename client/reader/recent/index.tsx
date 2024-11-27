import { SubscriptionManager } from '@automattic/data-stores';
import { WIDE_BREAKPOINT } from '@automattic/viewport';
import { useBreakpoint } from '@automattic/viewport-react';
import { DataViews, filterSortAndPaginate, View } from '@wordpress/dataviews';
import { translate } from 'i18n-calypso';
import { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import { UnknownAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import ReaderAvatar from 'calypso/blocks/reader-avatar';
import AsyncLoad from 'calypso/components/async-load';
import EmptyContent from 'calypso/components/empty-content';
import FormattedHeader from 'calypso/components/formatted-header';
import { getPostByKey } from 'calypso/state/reader/posts/selectors';
import { requestPaginatedStream } from 'calypso/state/reader/streams/actions';
import { viewStream } from 'calypso/state/reader-ui/actions';
import ReaderOnboarding from '../onboarding';
import EngagementBar from './engagement-bar';
import RecentPostField from './recent-post-field';
import RecentPostSkeleton from './recent-post-skeleton';
import type { PostItem, ReaderPost } from './types';
import type { AppState } from 'calypso/types';

import './style.scss';

const Recent = () => {
	const dispatch = useDispatch< ThunkDispatch< AppState, void, UnknownAction > >();
	const [ selectedItem, setSelectedItem ] = useState< ReaderPost | null >( null );
	const isWide = useBreakpoint( WIDE_BREAKPOINT );
	const [ isLoading, setIsLoading ] = useState( false );

	const [ view, setView ] = useState< View >( {
		type: 'list',
		search: '',
		fields: [ 'icon', 'post' ],
		perPage: 10,
		page: 1,
		layout: {
			primaryField: 'post',
			mediaField: 'icon',
		},
	} );

	const selectedRecentSidebarFeedId = useSelector< AppState, number | null >(
		( state ) => state.readerUi.sidebar.selectedRecentSite
	);

	const streamKey =
		selectedRecentSidebarFeedId !== null ? `recent:${ selectedRecentSidebarFeedId }` : 'recent';

	const data = useSelector( ( state: AppState ) => state.reader?.streams?.[ streamKey ] );

	const posts = useSelector( ( state: AppState ) => {
		const items = data?.items;
		if ( ! items ) {
			return {};
		}

		return items.reduce( ( acc: Record< string, PostItem >, item: ReaderPost ) => {
			const post = getPostByKey( state, {
				feedId: item.feedId,
				postId: item.postId,
			} );
			if ( post ) {
				acc[ `${ item?.feedId }-${ item?.postId }` ] = post;
			}
			return acc;
		}, {} );
	}, shallowEqual );

	const getPostFromItem = useCallback(
		( item: ReaderPost ) => {
			const postKey = `${ item?.feedId }-${ item?.postId }`;
			return posts[ postKey ];
		},
		[ posts ]
	);

	const fields = useMemo(
		() => [
			{
				id: 'icon',
				label: translate( 'Icon' ),
				render: ( { item }: { item: ReaderPost } ) => {
					const post = getPostFromItem( item );
					const iconUrl = post?.site_icon?.img || post?.author?.avatar_URL || '';
					return iconUrl ? <ReaderAvatar siteIcon={ iconUrl } iconSize={ 24 } /> : null;
				},
				enableHiding: false,
				enableSorting: false,
			},
			{
				id: 'post',
				label: translate( 'Post' ),
				getValue: ( { item }: { item: ReaderPost } ) =>
					`${ getPostFromItem( item )?.title ?? '' } - ${ item?.site_name ?? '' }`,
				render: ( { item }: { item: ReaderPost } ) => {
					return <RecentPostField post={ getPostFromItem( item ) } />;
				},
				enableHiding: false,
				enableSorting: false,
				enableGlobalSearch: true,
			},
		],
		[ getPostFromItem ]
	);

	const fetchData = useCallback( () => {
		dispatch( viewStream( streamKey, window.location.pathname ) as UnknownAction );
		dispatch(
			requestPaginatedStream( {
				streamKey,
				page: view.page,
				perPage: view.perPage,
			} ) as UnknownAction
		);
	}, [ dispatch, view, streamKey ] );

	const paginationInfo = useMemo( () => {
		return {
			totalItems: data?.pagination?.totalItems ?? 0,
			totalPages: data?.pagination?.totalPages ?? 0,
		};
	}, [ data?.pagination ] );

	const { data: shownData } = useMemo( () => {
		return filterSortAndPaginate( data?.items ?? [], view, fields );
	}, [ data?.items, view, fields ] );

	// Fetch the data when the component is mounted.
	useEffect( () => {
		fetchData();
	}, [ fetchData ] );

	// Set the first item as selected if no item is selected and screen is wide.
	useEffect( () => {
		if ( isWide && data?.items?.length > 0 && ! selectedItem ) {
			setSelectedItem( data.items[ 0 ] );
		}
	}, [ isWide, data?.items, selectedItem ] );

	// When the selected feed changes, clear the selected item and reset the page to 1.
	useEffect( () => {
		setSelectedItem( null );
		setView( ( prevView ) => ( {
			...prevView,
			page: 1,
		} ) );
	}, [ selectedRecentSidebarFeedId ] );

	useLayoutEffect( () => {
		setIsLoading( data?.isRequesting );
	}, [ data?.isRequesting ] );

	const { data: subscriptionsCount } = SubscriptionManager.useSubscriptionsCountQuery();
	const hasSubscriptions = subscriptionsCount?.blogs && subscriptionsCount.blogs > 0;

	return (
		<div className="recent-feed">
			<div
				className={ `recent-feed__list-column ${
					selectedItem && hasSubscriptions ? 'has-overlay' : ''
				} ${ ! hasSubscriptions ? 'recent-feed--no-subscriptions' : '' }` }
			>
				<div className="recent-feed__list-column-header">
					<FormattedHeader align="left" headerText={ translate( 'Recent' ) } />
				</div>
				<div className="recent-feed__list-column-content">
					{ ! hasSubscriptions ? (
						<>
							<p>
								{ translate(
									'{{strong}}Welcome!{{/strong}} Follow your favorite sites and their latest posts will appear here. Read, like, and comment in a distraction-free environment. Get started by selecting your interests below:',
									{
										components: {
											strong: <strong />,
										},
									}
								) }
							</p>
							<ReaderOnboarding forceShow />
						</>
					) : (
						<DataViews
							getItemId={ ( item: ReaderPost, index = 0 ) =>
								item.postId?.toString() ?? `item-${ index }`
							}
							view={ view as View }
							fields={ fields }
							data={ shownData }
							onChangeView={ ( newView: View ) =>
								setView( {
									type: newView.type,
									fields: newView.fields ?? [],
									layout: view.layout,
									perPage: newView.perPage,
									page: newView.page,
									search: newView.search,
								} )
							}
							paginationInfo={ paginationInfo }
							defaultLayouts={ { list: {} } }
							isLoading={ isLoading }
							selection={ selectedItem ? [ selectedItem.postId?.toString() ] : [] }
							onChangeSelection={ ( newSelection: string[] ) => {
								const selectedPost = data?.items?.find(
									( item: ReaderPost ) => item.postId?.toString() === newSelection[ 0 ]
								);
								setSelectedItem( selectedPost || null );
							} }
						/>
					) }
				</div>
			</div>
			{ hasSubscriptions && (
				<div className={ `recent-feed__post-column ${ selectedItem ? 'overlay' : '' }` }>
					{ ! ( selectedItem && getPostFromItem( selectedItem ) ) && isLoading && (
						<RecentPostSkeleton />
					) }
					{ ! isLoading && data?.items.length === 0 && (
						<EmptyContent
							title={ translate( 'Nothing Posted Yet' ) }
							line={ translate( 'This feed is currently empty.' ) }
							illustration="/calypso/images/illustrations/illustration-empty-results.svg"
							illustrationWidth={ 400 }
						/>
					) }
					{ data?.items.length > 0 && selectedItem && getPostFromItem( selectedItem ) && (
						<>
							<AsyncLoad
								require="calypso/blocks/reader-full-post"
								feedId={ selectedItem.feedId }
								postId={ selectedItem.postId }
								onClose={ () => setSelectedItem( null ) }
								layout="recent"
							/>
							<EngagementBar feedId={ selectedItem?.feedId } postId={ selectedItem?.postId } />
						</>
					) }
				</div>
			) }
		</div>
	);
};

export default Recent;
