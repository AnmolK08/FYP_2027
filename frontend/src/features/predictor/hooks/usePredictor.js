import { useMutation } from '@tanstack/react-query';
import { predictorApi } from '../predictor.api';

export function usePredictContest() {
  return useMutation({
    mutationFn: ({ currentRating, predictedRank, participants }) =>
      predictorApi.predictContest(currentRating, predictedRank, participants),
  });
}
