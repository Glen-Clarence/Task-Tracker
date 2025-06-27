import { useQueryClient } from "@tanstack/react-query";

interface UpdateCacheOptions<T> {
  queryKey: string[];
  getId: (item: T) => string;
}

export const useQueryCache = <T extends { id: string }>(
  options: UpdateCacheOptions<T>
) => {
  const queryClient = useQueryClient();

  const updateCache = {
    onSuccess: (newItem: T) => {
      queryClient.setQueryData<T[]>(options.queryKey, (old) => [
        ...(old || []),
        newItem,
      ]);
    },
    onUpdate: (updatedItem: T) => {
      queryClient.setQueryData<T[]>(options.queryKey, (old) =>
        old?.map((item) =>
          options.getId(item) === options.getId(updatedItem)
            ? updatedItem
            : item
        )
      );
    },
    onDelete: (deletedId: string) => {
      queryClient.setQueryData<T[]>(options.queryKey, (old) =>
        old?.filter((item) => options.getId(item) !== deletedId)
      );
    },
  };

  return { queryClient, updateCache };
};
