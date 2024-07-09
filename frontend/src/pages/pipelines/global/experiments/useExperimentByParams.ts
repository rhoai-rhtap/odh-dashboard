import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { experimentsRootPath } from '~/routes';
import useExperimentById from '~/concepts/pipelines/apiHooks/useExperimentById';
import { ExperimentKFv2 } from '~/concepts/pipelines/kfTypes';

export const useExperimentByParams = (): {
  experiment: ExperimentKFv2 | null;
  isExperimentLoaded: boolean;
} => {
  const navigate = useNavigate();
  const { experimentId } = useParams();
  const [experiment, isExperimentLoaded, experimentError] = useExperimentById(experimentId);

  // Redirect users to the Experiments list page when failing to retrieve the experiment from route params.
  React.useEffect(() => {
    if (isExperimentLoaded && experimentError) {
      navigate(experimentsRootPath);
    }
  }, [experimentError, isExperimentLoaded, navigate]);

  return { experiment, isExperimentLoaded };
};
