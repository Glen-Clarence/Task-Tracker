import { PlusIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { message } from "antd";
import { Folder, foldersApi } from "@/api/folders.api";

interface AddFolderProps {
  setIsModalOpen: (isModalOpen: boolean) => void;
}

const AddFolder: React.FC<AddFolderProps> = ({ setIsModalOpen }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Folder>();
  const { mutate: createFolder } = useMutation({
    mutationFn: foldersApi.create,
  });

  const onSubmit = async (values: Folder) => {
    createFolder(values, {
      onSuccess: () => {
        message.success("Folder added successfully!");
      },
      onError: () => {
        message.error("Failed to add note");
      },
      onSettled: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Input
            {...register("name", { required: "Name is required" })}
            placeholder="Enter folder name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <Button type="submit" className="w-fit ml-auto flex gap-2">
          <PlusIcon size={12} />
          Add Folder
        </Button>
      </form>
    </div>
  );
};

export default AddFolder;
