import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';
import { getSelectedSiteSlug } from 'calypso/state/ui/selectors';
import { SidebarItem, Sidebar, PanelWithSidebar } from '../components/panel-sidebar';
import { useAreAdvancedHostingFeaturesSupported } from '../hosting-features/features';
import AdministrationSettings from './administration';
import useIsAdministrationSettingSupported from './administration/hooks/use-is-administration-setting-supported';
import DeleteSite from './administration/tools/delete-site';
import ManageConnection from './administration/tools/manage-connection';
import ResetSite from './administration/tools/reset-site';
import TransferSite from './administration/tools/transfer-site';
import CachingSettings from './caching';
import SiteSettings from './site';
import WebServerSettings from './web-server';
import type { Context as PageJSContext } from '@automattic/calypso-router';

export function SettingsSidebar() {
	const slug = useSelector( getSelectedSiteSlug );

	const shouldShowAdministration = useIsAdministrationSettingSupported();

	const shouldShowAdvancedHostingFeatures = useAreAdvancedHostingFeaturesSupported();

	return (
		<Sidebar>
			<SidebarItem href={ `/sites/settings/site/${ slug }` }>{ __( 'Site' ) }</SidebarItem>
			<SidebarItem
				enabled={ shouldShowAdministration }
				href={ `/sites/settings/administration/${ slug }` }
			>
				{ __( 'Administration' ) }
			</SidebarItem>
			<SidebarItem href={ `/sites/settings/caching/${ slug }` }>{ __( 'Caching' ) }</SidebarItem>
			<SidebarItem
				enabled={ !! shouldShowAdvancedHostingFeatures }
				href={ `/sites/settings/web-server/${ slug }` }
			>
				{ __( 'Web server' ) }
			</SidebarItem>
		</Sidebar>
	);
}

export function siteSettings( context: PageJSContext, next: () => void ) {
	context.primary = (
		<PanelWithSidebar>
			<SettingsSidebar />
			<SiteSettings />
		</PanelWithSidebar>
	);
	next();
}

export function administrationSettings( context: PageJSContext, next: () => void ) {
	context.primary = (
		<PanelWithSidebar>
			<SettingsSidebar />
			<AdministrationSettings />
		</PanelWithSidebar>
	);
	next();
}

export function administrationToolResetSite( context: PageJSContext, next: () => void ) {
	context.primary = (
		<PanelWithSidebar>
			<SettingsSidebar />
			<ResetSite />
		</PanelWithSidebar>
	);
	next();
}

export function administrationToolTransferSite( context: PageJSContext, next: () => void ) {
	context.primary = (
		<PanelWithSidebar>
			<SettingsSidebar />
			<TransferSite />
		</PanelWithSidebar>
	);
	next();
}

export function administrationToolDeleteSite( context: PageJSContext, next: () => void ) {
	context.primary = (
		<PanelWithSidebar>
			<SettingsSidebar />
			<DeleteSite />
		</PanelWithSidebar>
	);
	next();
}

export function administrationToolManageConnection( context: PageJSContext, next: () => void ) {
	context.primary = (
		<PanelWithSidebar>
			<SettingsSidebar />
			<ManageConnection />
		</PanelWithSidebar>
	);
	next();
}

export function cachingSettings( context: PageJSContext, next: () => void ) {
	context.primary = (
		<PanelWithSidebar>
			<SettingsSidebar />
			<CachingSettings />
		</PanelWithSidebar>
	);
	next();
}

export function webServerSettings( context: PageJSContext, next: () => void ) {
	context.primary = (
		<PanelWithSidebar>
			<SettingsSidebar />
			<WebServerSettings />
		</PanelWithSidebar>
	);
	next();
}
