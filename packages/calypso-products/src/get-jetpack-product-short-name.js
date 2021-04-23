/**
 * Internal dependencies
 */
import { snakeCase } from './snake-case';
import { getJetpackProductsShortNames } from './translations';

/**
 * Get Jetpack product short name based on the product purchase object.
 *
 * @param   product {object}             Product purchase object
 * @returns         {string|object} Product short name
 */
export function getJetpackProductShortName( product ) {
	product = snakeCase( product );
	const jetpackProductShortNames = getJetpackProductsShortNames();

	return jetpackProductShortNames?.[ product.product_slug ];
}
