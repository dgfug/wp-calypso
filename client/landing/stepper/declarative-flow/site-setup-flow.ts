import type { StepPath } from './internals/steps-repository';
import type { Flow } from './internals/types';

export const siteSetupFlow: Flow = {
	useSteps() {
		return [ 'intent', 'options', 'build', 'sell', 'import', 'wpadmin' ];
	},
	useStepNavigation( currentStep, navigate ) {
		const goBack = () => {
			if (
				currentStep === 'options' ||
				currentStep === 'build' ||
				currentStep === 'sell' ||
				currentStep === 'import' ||
				currentStep === 'wpadmin'
			) {
				navigate( 'intent' );
			}
		};
		const goNext = goBack;
		const goToStep = ( step: StepPath ) => {
			navigate( step );
		};
		return { goNext, goBack, goToStep };
	},
};
