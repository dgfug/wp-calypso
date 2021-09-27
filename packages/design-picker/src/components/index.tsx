/* eslint-disable wpcalypso/jsx-classname-namespace */

import { Button, Tooltip } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { sprintf } from '@wordpress/i18n';
import { useI18n } from '@wordpress/react-i18n';
import classnames from 'classnames';
import React from 'react';
import { getAvailableDesigns, getDesignUrl, mShotOptions, isBlankCanvasDesign } from '../utils';
import MShotsImage from './mshots-image';
export { default as MShotsImage } from './mshots-image';
import type { Design } from '../types';

import './style.scss';

const makeOptionId = ( { slug }: Design ): string => `design-picker__option-name__${ slug }`;

interface DesignPreviewImageProps {
	design: Design;
	locale: string;
}

const DesignPreviewImage: React.FC< DesignPreviewImageProps > = ( { design, locale } ) => (
	<MShotsImage
		url={ getDesignUrl( design, locale ) }
		aria-labelledby={ makeOptionId( design ) }
		alt=""
		options={ mShotOptions() }
		scrollable={ design.preview !== 'static' }
	/>
);

interface DesignButtonProps {
	design: Design;
	locale: string;
	onSelect: ( design: Design ) => void;
	premiumBadge?: React.ReactNode;
	disabled?: boolean;
}

const DesignButton: React.FC< DesignButtonProps > = ( {
	locale,
	onSelect,
	design,
	premiumBadge,
	disabled,
} ) => {
	const { __ } = useI18n();

	const isBlankCanvas = isBlankCanvasDesign( design );

	const defaultTitle = design.title;
	const blankCanvasTitle = __( 'Start with an empty page', __i18n_text_domain__ );
	const designTitle = isBlankCanvas ? blankCanvasTitle : defaultTitle;

	return (
		<button
			className="design-picker__design-option"
			disabled={ disabled }
			data-e2e-button={ design.is_premium ? 'paidOption' : 'freeOption' }
			onClick={ () => onSelect( design ) }
		>
			<span
				className={ classnames(
					'design-picker__image-frame',
					'design-picker__image-frame-landscape',
					design.preview === 'static' ? 'design-picker__static' : 'design-picker__scrollable',
					{ 'design-picker__image-frame-blank': isBlankCanvas }
				) }
			>
				{ isBlankCanvas ? (
					<div className="design-picker__image-frame-blank-canvas__title">
						{ __( 'Blank Canvas' ) }
					</div>
				) : (
					<div className="design-picker__image-frame-inside">
						<DesignPreviewImage design={ design } locale={ locale } />
					</div>
				) }
			</span>
			<span className="design-picker__option-overlay">
				<span id={ makeOptionId( design ) } className="design-picker__option-meta">
					<span className="design-picker__option-name">{ designTitle }</span>
					{ design.is_premium && premiumBadge && (
						<Tooltip
							position="bottom center"
							text={ __( 'Requires a Personal plan or above', __i18n_text_domain__ ) }
						>
							<div className="design-picker__premium-container">{ premiumBadge }</div>
						</Tooltip>
					) }
				</span>
			</span>
		</button>
	);
};

interface DesignButtonCoverProps {
	design: Design;
	onSelect: ( design: Design ) => void;
	onPreview: ( design: Design ) => void;
}

const DesignButtonCover: React.FC< DesignButtonCoverProps > = ( {
	design,
	onSelect,
	onPreview,
} ) => {
	const { __ } = useI18n();
	const isBlankCanvas = isBlankCanvasDesign( design );
	const designTitle = isBlankCanvas ? __( 'Blank Canvas' ) : design.title;

	return (
		<div className="design-button-cover">
			<div className="design-button-cover__button-groups">
				<Button
					className="design-button-cover__button"
					isPrimary
					onClick={ () => onSelect( design ) }
				>
					{
						// translators: %s is the title of design with currency. Eg: Alves
						sprintf( __( 'Start with %s', __i18n_text_domain__ ), designTitle )
					}
				</Button>
				<Button className="design-button-cover__button" onClick={ () => onPreview( design ) }>
					{
						// translators: %s is the title of design with currency. Eg: Alves
						sprintf( __( 'Preview %s', __i18n_text_domain__ ), designTitle )
					}
				</Button>
			</div>
		</div>
	);
};

interface DesignButtonContainerProps extends DesignButtonProps {
	onPreview?: ( design: Design ) => void;
}

const DesignButtonContainer: React.FC< DesignButtonContainerProps > = ( {
	onPreview,
	...props
} ) => {
	const isDesktop = useViewportMatch( 'large' );

	if ( ! onPreview ) {
		return <DesignButton { ...props } />;
	}

	// Show the preview directly when selecting the design if the device is not desktop
	if ( ! isDesktop ) {
		return <DesignButton { ...props } onSelect={ onPreview } />;
	}

	return (
		<div className="design-button-container">
			<DesignButtonCover
				design={ props.design }
				onSelect={ props.onSelect }
				onPreview={ onPreview }
			/>
			<DesignButton { ...props } disabled />
		</div>
	);
};

export interface DesignPickerProps {
	locale: string;
	onSelect: ( design: Design ) => void;
	onPreview?: ( design: Design ) => void;
	designs?: Design[];
	premiumBadge?: React.ReactNode;
	isGridMinimal?: boolean;
	theme?: 'dark' | 'light';
	className?: string;
}
const DesignPicker: React.FC< DesignPickerProps > = ( {
	locale,
	onSelect,
	onPreview,
	designs = getAvailableDesigns().featured.filter(
		// By default, exclude anchorfm-specific designs
		( design ) => design.features.findIndex( ( f ) => f === 'anchorfm' ) < 0
	),
	premiumBadge,
	isGridMinimal,
	theme = 'light',
	className,
} ) => {
	return (
		<div className={ classnames( 'design-picker', `design-picker--theme-${ theme }`, className ) }>
			<div className={ isGridMinimal ? 'design-picker__grid-minimal' : 'design-picker__grid' }>
				{ designs.map( ( design ) => (
					<DesignButtonContainer
						key={ design.slug }
						design={ design }
						locale={ locale }
						onSelect={ onSelect }
						onPreview={ onPreview }
						premiumBadge={ premiumBadge }
					/>
				) ) }
			</div>
		</div>
	);
};

export default DesignPicker;
