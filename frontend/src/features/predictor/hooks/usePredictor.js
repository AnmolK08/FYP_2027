import { useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function usePredictContest() {
  return useMutation({
    mutationFn: ({ currentRating, predictedRank, participants }) =>
      api.predictContest(currentRating, predictedRank, participants),
    onMutate: () => {
      const toastId = toast.loading('Calculating rating...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      toast.success(data?.message || 'Rating calculated successfully!', {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to calculate rating', {
        id: context?.toastId,
      });
    },
  });
}
