import { PlusIcon } from "lucide-react";
import { Note, notesApi } from "@/api/notes.api";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { message } from "antd";
import { queryClient } from "@/lib/queryClient";

interface AddnotesProps {
  setIsModalOpen: (isModalOpen: boolean) => void;
}

const Addnotes: React.FC<AddnotesProps> = ({ setIsModalOpen }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Note>();
  const { mutate: createNote } = useMutation({
    mutationFn: notesApi.create,
  });

  const onSubmit = async (values: Note) => {
    createNote(values, {
      onSuccess: () => {
        message.success("Note added successfully!");
        queryClient.invalidateQueries({ queryKey: ["notes"] });
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
            placeholder="Enter note name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <Button type="submit" className="w-fit ml-auto flex gap-2">
          <PlusIcon size={12} />
          Add Note
        </Button>
      </form>
    </div>
  );
};

export default Addnotes;
