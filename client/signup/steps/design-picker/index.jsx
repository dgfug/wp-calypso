import DesignPicker, { getAvailableDesigns, isBlankCanvasDesign } from '@automattic/design-picker';
import classnames from 'classnames';
import { localize } from 'i18n-calypso';
import page from 'page';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import QueryTheme from 'calypso/components/data/query-theme';
import WebPreview from 'calypso/components/web-preview';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { addQueryArgs } from 'calypso/lib/route';
import StepWrapper from 'calypso/signup/step-wrapper';
import { getStepUrl } from 'calypso/signup/utils';
import { submitSignupStep } from 'calypso/state/signup/progress/actions';
import { getThemeDemoUrl } from 'calypso/state/themes/selectors';
import PreviewToolbar from './preview-toolbar';
import './style.scss';

class DesignPickerStep extends Component {
	static propTypes = {
		goToNextStep: PropTypes.func.isRequired,
		signupDependencies: PropTypes.object.isRequired,
		stepName: PropTypes.string.isRequired,
		locale: PropTypes.string.isRequired,
		translate: PropTypes.func,
		largeThumbnails: PropTypes.bool,
		showOnlyThemes: PropTypes.bool,
	};

	static defaultProps = {
		useHeadstart: true,
		largeThumbnails: false,
		showOnlyThemes: false,
	};

	state = {
		selectedDesign: null,
		// Only offering designs that are also available as themes. This means excluding
		// designs where the `template` has a layout that's different from what the theme's
		// default Headstart annotation provides.
		availableDesigns: getAvailableDesigns().featured.filter(
			( { features, template, theme } ) => theme === template && ! features.includes( 'anchorfm' )
		),
	};

	componentDidUpdate( prevProps ) {
		if ( prevProps.stepSectionName !== this.props.stepSectionName ) {
			this.updateSelectedDesign();
		}
	}

	updateSelectedDesign() {
		const { stepSectionName } = this.props;
		const { availableDesigns } = this.state;

		this.setState( {
			selectedDesign: availableDesigns.find( ( { theme } ) => theme === stepSectionName ),
		} );
	}

	pickDesign = ( selectedDesign ) => {
		this.submitDesign( selectedDesign );
	};

	previewDesign = ( selectedDesign ) => {
		page( getStepUrl( this.props.flowName, this.props.stepName, selectedDesign.theme ) );
	};

	submitDesign = ( selectedDesign = this.state.selectedDesign ) => {
		recordTracksEvent( 'calypso_signup_select_design', {
			theme: `pub/${ selectedDesign?.theme }`,
			template: selectedDesign?.template,
		} );

		this.props.submitSignupStep(
			{
				stepName: this.props.stepName,
			},
			{
				selectedDesign,
			}
		);

		this.props.goToNextStep();
	};

	renderDesignPicker() {
		// Use <DesignPicker>'s preferred designs by default
		let designs = undefined;

		if ( this.props.showOnlyThemes ) {
			designs = this.state.availableDesigns;
		}

		return (
			<DesignPicker
				designs={ designs }
				theme={ this.props.isReskinned ? 'light' : 'dark' }
				locale={ this.props.locale } // props.locale obtained via `localize` HoC
				onSelect={ this.pickDesign }
				onPreview={ this.previewDesign }
				className={ classnames( {
					'design-picker-step__is-large-thumbnails': this.props.largeThumbnails,
				} ) }
			/>
		);
	}

	renderDesignPreview() {
		const {
			demoUrl,
			signupDependencies: { siteSlug },
			translate,
		} = this.props;

		const { selectedDesign } = this.state;

		const previewUrl = demoUrl
			? addQueryArgs(
					{
						demo: true,
						iframe: true,
						theme_preview: true,
					},
					demoUrl
			  )
			: '';

		return (
			<div className="design-picker__preview">
				<QueryTheme siteId="wpcom" themeId={ selectedDesign.theme } />
				<WebPreview
					className="design-picker__web-preview"
					showPreview
					isContentOnly
					showUrl={ false }
					showClose={ false }
					showEdit={ false }
					externalUrl={ siteSlug }
					previewUrl={ previewUrl }
					loadingMessage={ translate(
						'{{strong}}One moment, please…{{/strong}} loading your site.',
						{ components: { strong: <strong /> } }
					) }
					toolbarComponent={ PreviewToolbar }
				/>
			</div>
		);
	}

	headerText() {
		const { translate } = this.props;

		return translate( 'Choose a design' );
	}
	subHeaderText() {
		const { translate } = this.props;

		return translate( 'Pick your favorite homepage layout. You can customize or change it later.' );
	}

	render() {
		const { isReskinned, translate } = this.props;
		const { selectedDesign } = this.state;
		const headerText = this.headerText();
		const subHeaderText = this.subHeaderText();

		if ( selectedDesign ) {
			const isBlankCanvas = isBlankCanvasDesign( selectedDesign );
			const designTitle = isBlankCanvas ? translate( 'Blank Canvas' ) : selectedDesign.title;

			return (
				<StepWrapper
					{ ...this.props }
					fallbackHeaderText={ designTitle }
					headerText={ designTitle }
					fallbackSubHeaderText={ '' }
					subHeaderText={ '' }
					stepContent={ this.renderDesignPreview() }
					align={ 'center' }
					hideSkip
					hideNext={ false }
					nextLabelText={ translate( 'Start with %(designTitle)s', {
						args: { designTitle },
					} ) }
					goToNextStep={ this.submitDesign }
				/>
			);
		}

		return (
			<StepWrapper
				{ ...this.props }
				fallbackHeaderText={ headerText }
				headerText={ headerText }
				fallbackSubHeaderText={ subHeaderText }
				subHeaderText={ subHeaderText }
				stepContent={ this.renderDesignPicker() }
				align={ isReskinned ? 'left' : 'center' }
				skipButtonAlign={ isReskinned ? 'top' : 'bottom' }
			/>
		);
	}
}

export default connect(
	( state, { stepSectionName: themeId } ) => {
		return {
			demoUrl: themeId ? getThemeDemoUrl( state, themeId, 'wpcom' ) : '',
		};
	},
	{ submitSignupStep }
)( localize( DesignPickerStep ) );
