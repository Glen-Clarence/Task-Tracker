import React, { useState, DragEvent } from "react";
import { PlusIcon, WandSparkles } from "lucide-react";
import fire from "../../assets/fire.lottie";
import { saveAs } from "file-saver";

import { motion } from "framer-motion";

import TrelloCard from "../Card";
import useKanbanStore, { ColumnType, Task } from "./useKanbanStore";
import { useKanban } from "./useKanban";
import {
  Form,
  FormInstance,
  Button,
  Select,
  Modal,
  DatePicker,
  theme,
  ConfigProvider,
  message,
} from "antd";
import { Button as ShadButton } from "../ui/button";
import { priorityOptions , repositoryOptions } from "../../utils/options";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";
import { elaborateTaskWithGroq } from "../../utils/groqTaskElaborator";
import { DotLottie, DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useMutation } from "@tanstack/react-query";
import { taskApi } from "@/api/task.api";

type FilterOption = {
  id: string;
  label: string;
  disabled?: boolean;
};

export const Kanban = () => {
  const {
    form,
    handleSubmit,
    editingTaskForm,
    editingTask,
    handleEdit,
    updateTask,
  } = useKanban();

  const filterOptions: FilterOption[] = [
    { id: "board", label: "Board", disabled: false },
    { id: "list", label: "List", disabled: false },
  ];

  const [activeFilter, setActiveFilter] = useState<string>(filterOptions[0].id);

  const { mutate: downloadTasks } = useMutation({
    mutationFn: taskApi.download,
    onSuccess: (data) => {
      console.log(data);
      saveAs(data, "tasks.xlsx");
    },
    onError: () => {
      message.error("Error downloading tasks");
    },
  });

  return (
    <div className="container 2xl:max-w-[100%] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-white border-b border-[#ccc] pb-4">
          My Tasks
        </h1>
        <ShadButton onClick={() => downloadTasks()}>
          Download Your Tasks
        </ShadButton>
      </div>
      <div className="flex gap-2 mt-2">
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#777",
              fontSize: 12,
            },
            algorithm: theme.darkAlgorithm,
          }}
        >
          <div className="flex gap-2 mt-2">
            {filterOptions.map((option) => (
              <Button
                key={option.id}
                type={activeFilter === option.id ? "default" : "primary"}
                ghost={activeFilter === option.id}
                size="small"
                disabled={option.disabled}
                onClick={() => setActiveFilter(option.id)}
                className={
                  activeFilter === option.id
                    ? "!text-white !border-white hover:!text-white hover:!border-white"
                    : ""
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </ConfigProvider>
      </div>
      <Board
        form={form}
        handleSubmit={handleSubmit}
        editingTaskForm={editingTaskForm}
        editingTask={editingTask as Task}
        handleEdit={handleEdit}
        updateTask={updateTask}
      />
    </div>
  );
};

const Board = ({
  form,
  handleSubmit,
  editingTaskForm,
  editingTask,
  handleEdit,
  updateTask,
}: {
  form: FormInstance;
  handleSubmit: (values: Task) => void;
  editingTaskForm: FormInstance;
  editingTask: Task;
  handleEdit: (task: Task) => void;
  updateTask: () => void;
}) => {
  const { tasks, setTasks } = useKanbanStore();

  return (
    <div className="flex h-full w-full gap-3 overflow-hidden">
      <Column
        title="Pending"
        column="PENDING"
        headingColor="text-neutral-100"
        cards={tasks}
        setCards={setTasks}
        form={form}
        handleSubmit={handleSubmit}
        editingTaskForm={editingTaskForm}
        editingTask={editingTask}
        handleEdit={handleEdit}
        updateTask={updateTask}
      />
      <Column
        title="Not started"
        column="NOT_STARTED"
        headingColor="text-yellow-200"
        cards={tasks}
        setCards={setTasks}
        form={form}
        handleSubmit={handleSubmit}
        editingTaskForm={editingTaskForm}
        editingTask={editingTask}
        handleEdit={handleEdit}
        updateTask={updateTask}
      />
      <Column
        title="In progress"
        column="IN_PROGRESS"
        headingColor="text-blue-200"
        cards={tasks}
        setCards={setTasks}
        form={form}
        handleSubmit={handleSubmit}
        editingTaskForm={editingTaskForm}
        editingTask={editingTask}
        handleEdit={handleEdit}
        updateTask={updateTask}
      />
      <Column
        title="Complete"
        column="COMPLETED"
        headingColor="text-emerald-200"
        cards={tasks}
        setCards={setTasks}
        form={form}
        handleSubmit={handleSubmit}
        editingTaskForm={editingTaskForm}
        editingTask={editingTask}
        handleEdit={handleEdit}
        updateTask={updateTask}
      />
      <BurnBarrel />
    </div>
  );
};

type ColumnProps = {
  title: string;
  headingColor: string;
  cards: Task[];
  column: ColumnType;
  setCards: (tasks: Task) => void;
  form: FormInstance;
  handleSubmit: (values: Task) => void;
  editingTaskForm: FormInstance;
  editingTask: Task;
  handleEdit: (task: Task) => void;
  updateTask: () => void;
};

const Column = ({
  title,
  headingColor,
  cards,
  column,
  form,
  handleSubmit,
  editingTaskForm,
  editingTask,
  handleEdit,
  updateTask,
}: ColumnProps) => {
  const [active, setActive] = useState(false);
  const { moveTask } = useKanbanStore();

  const handleDragStart = (e: DragEvent, card: Task) => {
    e.dataTransfer.setData("cardId", card.id as string);
  };

  const handleDragEnd = async (e: DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");

    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);

    const before = element.dataset.before || "-1";
    moveTask(cardId, column, before);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    highlightIndicator(e);

    setActive(true);
  };

  const clearHighlights = (els?: HTMLElement[]) => {
    const indicators = els || getIndicators();

    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e: DragEvent) => {
    const indicators = getIndicators();

    clearHighlights(indicators);

    const el = getNearestIndicator(e, indicators);

    el.element.style.opacity = "1";
  };

  const getNearestIndicator = (e: DragEvent, indicators: HTMLElement[]) => {
    const DISTANCE_OFFSET = 50;

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();

        const offset = e.clientY - (box.top + DISTANCE_OFFSET);

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );

    return el;
  };

  const getIndicators = () => {
    return Array.from(
      document.querySelectorAll(
        `[data-column="${column}"]`
      ) as unknown as HTMLElement[]
    );
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const filteredCards = cards.filter((c) => c.column === column);

  return (
    <div
      className="w-56 shrink-0 min-h-[90vh]"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="mb-3 flex items-center justify-between sticky top-0  z-10 pt-2">
        <div className="flex items-center justify-between w-full px-3 py-2 rounded-lg">
          <h3 className={`font-medium text-sm ${headingColor}`}>{title}</h3>
          <div className="flex items-center justify-end">
            <AddCard column={column} form={form} handleSubmit={handleSubmit} />
          </div>
        </div>
        {/* <span className="rounded text-sm text-neutral-400">
          {filteredCards.length}
        </span> */}
      </div>
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`h-[calc(100vh-10rem)] overflow-y-auto w-full transition-colors px-1 rounded-md  ${
          active ? "bg-neutral-800/50" : "bg-neutral-800/0"
        }`}
        style={{
          scrollbarWidth: "none",
        }}
      >
        {filteredCards.map((c) => {
          return (
            <Card
              key={c.id}
              {...c}
              handleDragStart={handleDragStart}
              editingTaskForm={editingTaskForm}
              editingTask={editingTask}
              handleEdit={handleEdit}
              updateTask={updateTask}
            />
          );
        })}
        <DropIndicator beforeId={null} column={column} />
      </div>
    </div>
  );
};

type CardProps = Task & {
  handleDragStart: (e: React.DragEvent, card: Task) => void;
  editingTaskForm: FormInstance;
  editingTask: Task;
  handleEdit: (task: Task) => void;
  updateTask: () => void;
};

const Card = ({
  title,
  description,
  id,
  column,
  date,
  createdAt,
  employeeId,
  isForAWeek,
  priority,
  status,
  updatedAt,
  userId,
  handleDragStart,
  editingTaskForm,
  editingTask,
  handleEdit,
  updateTask,
}: CardProps) => {
  const cardData = {
    title,
    description,
    id,
    column,
    date,
    createdAt,
    employeeId,
    isForAWeek,
    priority,
    status,
    updatedAt,
    userId,
  };

  const deleteTask = useKanbanStore((state) => state.deleteTask);

  return (
    <>
      <DropIndicator beforeId={id as string} column={column as string} />
      <motion.div
        layout
        layoutId={id}
        draggable="true"
        // @ts-expect-error drag event mismatch
        onDragStart={(e: React.DragEvent) =>
          handleDragStart(e, { title, id, column })
        }
        className="cursor-grab  active:cursor-grabbing"
      >
        <TrelloCard
          cardData={cardData as Task}
          editingTaskForm={editingTaskForm}
          editingTodo={editingTask as string}
          handleEdit={() => handleEdit(cardData as Task)}
          handleDelete={() => deleteTask(id as string)}
          updateTodo={updateTask}
        />
      </motion.div>
    </>
  );
};

type DropIndicatorProps = {
  beforeId: string | null;
  column: string;
};

const DropIndicator = ({ beforeId, column }: DropIndicatorProps) => {
  return (
    <div
      data-before={beforeId || "-1"}
      data-column={column}
      className="my-0.5 h-0.5 w-full bg-violet-400 opacity-0"
    />
  );
};

const BurnBarrel = () => {
  const { moveTaskToEnd } = useKanbanStore();

  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();

    dotLottie?.play();
  };

  const handleDragLeave = () => {
    dotLottie?.pause();
  };

  const handleDragEnd = (e: DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");
    moveTaskToEnd(cardId);

    dotLottie?.pause();
  };

  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className="mt-10 grid h-56 w-56 shrink-0 place-content-center rounded text-3xl"
    >
      <DotLottieReact
        src={fire}
        dotLottieRefCallback={setDotLottie}
        style={{ width: "224px" }}
      />
      {/* {active ? <Flame className="animate-bounce" /> : <Trash2 />} */}
    </div>
  );
};

type AddCardProps = {
  column: ColumnType;
  form: FormInstance;
  handleSubmit: (values: Task) => void;
};

const AddCard = ({ column, form, handleSubmit }: AddCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  form.setFieldValue("status", column);

  const handleElaborate = async () => {
    setLoadingAI(true);
    try {
      const elaboratedTask = await elaborateTaskWithGroq(
        form.getFieldValue("title")
      );
      form.setFieldValue("description", elaboratedTask);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <>
      <Button
        type="default"
        onClick={() => setIsModalOpen(true)}
        icon={<PlusIcon size={12} />}
        size="small"
        ghost
      />
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={false}
        title={`Add Task to ${column}`}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            handleSubmit(values);
            setIsModalOpen(false);
          }}
          initialValues={{
            priority: "MEDIUM",
            date: dayjs(), // Get today's date using dayjs
          }}
          // disabled={editingTodo !== null}
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please enter a title" }]}
              >
                <TextArea rows={4} placeholder="Enter Your Task" />
              </Form.Item>
              <Button
                onClick={handleElaborate}
                loading={loadingAI}
                icon={<WandSparkles size={12} />}
                size="small"
                className="mb-4"
              >
                Elaborate with AI
              </Button>
            </div>

            <Form.Item
              name="description"
              label="Description"
              rules={[
                {
                  required: true,
                  message: "Please enter a description",
                },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="You dont have to enter a description just click elaborate with AI"
              />
            </Form.Item>
          </div>

          <div className="grid xl:grid-cols-3 grid-cols-1 gap-4">
            <Form.Item
              name="priority"
              label="Priority"
              rules={[
                {
                  required: true,
                  message: "Please select a priority",
                },
              ]}
            >
              <Select placeholder="Select priority" options={priorityOptions} />
            </Form.Item>

            <Form.Item
              name="date"
              label="Date"
              rules={[{ required: true, message: "Please select a date" }]}
            >
              <DatePicker format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item
              name="repository"
              label="Repository"
            >
              <Select 
                placeholder="Select repository" 
                options={repositoryOptions}
                allowClear
              />
            </Form.Item>
          </div>
          <div className="grid xl:grid-cols-2 grid-cols-1 gap-4">
            <div></div>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlusIcon size={12} />}
                size="small"
                block
                className="!w-fit ml-auto !flex"
              >
                Add Task
              </Button>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
};
