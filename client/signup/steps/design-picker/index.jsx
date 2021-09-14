import DesignPicker, { getAvailableDesigns } from '@automattic/design-picker';
import classnames from 'classnames';
import { localize } from 'i18n-calypso';
import page from 'page';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import WebPreview from 'calypso/components/web-preview';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { addQueryArgs } from 'calypso/lib/route';
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
		availableDesigns: getAvailableDesigns().featured,
	};

	state = {
		selectedDesign: null,
	};

	componentDidUpdate( prevProps ) {
		if ( prevProps.stepSectionName !== this.props.stepSectionName ) {
			this.updateSelectedDesign();
		}
	}

	updateSelectedDesign() {
		const { stepSectionName, availableDesigns } = this.props;

		this.setState( {
			selectedDesign: availableDesigns.find( ( { theme } ) => theme === stepSectionName ),
		} );
	}

	pickDesign = ( selectedDesign ) => {
		page( getStepUrl( this.props.flowName, this.props.stepName, selectedDesign.theme ) );
	};

	submitDesign = () => {
		const { selectedDesign } = this.state;

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
			// Only offering designs that are also available as themes. This means excluding
			// designs where the `template` has a layout that's different from what the theme's
			// default Headstart annotation provides.
			designs = this.props.availableDesigns.filter(
				( { features, template, theme } ) => theme === template && ! features.includes( 'anchorfm' )
			);
		}

		return (
			<DesignPicker
				designs={ designs }
				theme={ this.props.isReskinned ? 'light' : 'dark' }
				locale={ this.props.locale } // props.locale obtained via `localize` HoC
				onSelect={ this.pickDesign }
				className={ classnames( {
					'design-picker-step__is-large-thumbnails': this.props.largeThumbnails,
				} ) }
			/>
		);
	}

	renderDesignPreview() {
		const {
			signupDependencies: { siteSlug },
			translate,
		} = this.props;

		const { selectedDesign } = this.state;

		const previewUrl = addQueryArgs(
			{
				theme: `pub/${ selectedDesign.theme }`,
				hide_banners: true,
				demo: true,
				iframe: true,
				theme_preview: true,
			},
			`//${ siteSlug }`
		);

		return (
			<div className="design-picker__preview">
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
		const { isReskinned } = this.props;
		const { selectedDesign } = this.state;
		const headerText = this.headerText();
		const subHeaderText = this.subHeaderText();

		if ( selectedDesign ) {
			return (
				<StepWrapper
					{ ...this.props }
					fallbackHeaderText={ selectedDesign.title }
					headerText={ selectedDesign.title }
					fallbackSubHeaderText={ '' }
					subHeaderText={ '' }
					stepContent={ this.renderDesignPreview() }
					align={ 'center' }
					hideSkip
					hideNext={ false }
					nextLabelText={ this.props.translate( 'Start with %(designTitle)s', {
						args: { designTitle: selectedDesign.title },
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

export default connect( null, { submitSignupStep } )( localize( DesignPickerStep ) );
