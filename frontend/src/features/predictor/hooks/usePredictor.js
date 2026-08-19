import { useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function usePredictContest() {
  return useMutation({
    mutationFn: ({ currentRating, predictedRank, participants }) =>
      api.predictContest(currentRating, predictedRank, participants),
  });
}
