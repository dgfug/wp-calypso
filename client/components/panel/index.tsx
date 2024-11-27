import { FormLabel } from '@automattic/components';
import clsx from 'clsx';
import Main from 'calypso/components/main';

import './style.scss';

export function Panel( {
	className,
	wide,
	children,
}: {
	className?: string;
	wide?: boolean;
	children: React.ReactNode;
} ) {
	return (
		<Main
			className={ clsx( 'panel', className, {
				'panel--wide': wide,
			} ) }
		>
			{ children }
		</Main>
	);
}

export function PanelSection( {
	isBorderless,
	className,
	children,
}: {
	isBorderless?: boolean;
	className?: string;
	children: React.ReactNode;
} ) {
	return (
		<div
			className={ clsx( 'panel-section', className, {
				'panel-section--borderless': isBorderless,
			} ) }
		>
			{ children }
		</div>
	);
}

export function PanelHeading( {
	asFormLabel,
	id,
	children,
}: {
	asFormLabel?: boolean;
	id?: string;
	children: React.ReactNode;
} ) {
	if ( asFormLabel ) {
		return <FormLabel>{ children }</FormLabel>;
	}
	return <h2 id={ id }>{ children }</h2>;
}

export function PanelDescription( { children }: { children: React.ReactNode } ) {
	return <p className="panel-description">{ children }</p>;
}
