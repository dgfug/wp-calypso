import DesignPicker, {
	getAvailableDesigns,
	isBlankCanvasDesign,
	getDesignUrl,
} from '@automattic/design-picker';
import { compose } from '@wordpress/compose';
import { withViewportMatch } from '@wordpress/viewport';
import classnames from 'classnames';
import { localize } from 'i18n-calypso';
import page from 'page';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import WebPreview from 'calypso/components/web-preview';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import StepWrapper from 'calypso/signup/step-wrapper';
import { getStepUrl } from 'calypso/signup/utils';
import { submitSignupStep } from 'calypso/state/signup/progress/actions';
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
		scrollTop: 0,
	};

	componentDidUpdate( prevProps ) {
		if ( prevProps.stepSectionName !== this.props.stepSectionName ) {
			this.updateSelectedDesign();
			this.updateScrollPosition();
		}
	}

	updateScrollPosition() {
		if ( this.props.stepSectionName ) {
			this.setState( { scrollTop: document.scrollingElement.scrollTop } );
		} else {
			// Defer restore scroll position to ensure DesignPicker is rendered
			window.setTimeout( () => {
				document.scrollingElement.scrollTop = this.state.scrollTop;
			} );
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
			signupDependencies: { siteSlug },
			locale,
			translate,
		} = this.props;

		const { selectedDesign } = this.state;
		const previewUrl = getDesignUrl( selectedDesign, locale, { iframe: true } );

		return (
			<WebPreview
				className="design-picker__web-preview"
				showPreview
				isContentOnly
				showClose={ false }
				showEdit={ false }
				externalUrl={ siteSlug }
				previewUrl={ previewUrl }
				loadingMessage={ translate( '{{strong}}One moment, please…{{/strong}} loading your site.', {
					components: { strong: <strong /> },
				} ) }
				toolbarComponent={ PreviewToolbar }
			/>
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
		const { isReskinned, isMobile, translate } = this.props;
		const { selectedDesign } = this.state;
		const headerText = this.headerText();
		const subHeaderText = this.subHeaderText();

		if ( selectedDesign ) {
			const isBlankCanvas = isBlankCanvasDesign( selectedDesign );
			const designTitle = isBlankCanvas ? translate( 'Blank Canvas' ) : selectedDesign.title;

			return (
				<StepWrapper
					{ ...this.props }
					className="design-picker__preview"
					fallbackHeaderText={ designTitle }
					headerText={ designTitle }
					fallbackSubHeaderText={ '' }
					subHeaderText={ '' }
					stepContent={ this.renderDesignPreview() }
					align={ isMobile ? 'left' : 'center' }
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

export default compose(
	connect( null, { submitSignupStep } ),
	withViewportMatch( { isMobile: '< small' } ),
	localize
)( DesignPickerStep );
