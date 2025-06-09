import { Button } from "../ui/button";
import { useState } from "react";
import Addnotes from "../modals/Addnotes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import useNotes from "./useNotes";
import AddFolder from "../modals/AddFolder";
import dayjs from "dayjs";
import { useNavigate } from "react-router";

const Notes = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const { folders, notes } = useNotes();

  const navigate = useNavigate();

  return (
    <div className="space-y-4 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-white">Recent Folders</h1>
        <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
          <DialogTrigger asChild>
            <Button>New Folder</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Folder</DialogTitle>
            </DialogHeader>
            <AddFolder setIsModalOpen={setIsFolderDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap gap-4 text-white mt-4">
        {folders?.map((folder) => (
          <div
            key={folder.id}
            className="bg-black/70 rounded-2xl cursor-pointer hover:scale-105 transition-all w-[200px] h-[125px] px-4 flex flex-col justify-center items-start gap-2"
          >
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                fill="none"
                viewBox="0 0 96 96"
                id="folder"
              >
                <path
                  fill="#000"
                  fill-rule="evenodd"
                  d="M19.3209 22.751C14.925 23.1944 11.7208 27.1175 12.1643 31.5135L12.9672 39.4731L15.376 63.3519L16.179 71.3115C16.6224 75.7075 20.5456 78.9116 24.9415 78.4682L76.6789 73.2491C81.0749 72.8056 84.2791 68.8825 83.8356 64.4865L80.6238 32.6481C80.1804 28.2521 76.2573 25.048 71.8613 25.4914L40.0229 28.7032C39.5794 24.3072 35.6563 21.1031 31.2603 21.5465L19.3209 22.751Z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#000"
                  fill-rule="evenodd"
                  d="M10.1743 31.7142C9.62002 26.2193 13.6252 21.3154 19.1202 20.761L31.0596 19.5566C35.873 19.0711 40.233 22.0842 41.613 26.5326L71.6605 23.5015C77.1555 22.9472 82.0594 26.9524 82.6137 32.4474L85.8255 64.2858C86.3798 69.7807 82.3746 74.6846 76.8796 75.239L25.1422 80.4581C19.6473 81.0124 14.7434 77.0072 14.189 71.5122L10.1743 31.7142ZM71.8613 25.4914C76.2572 25.048 80.1803 28.2521 80.6238 32.6481L83.8356 64.4865C84.279 68.8825 81.0749 72.8056 76.6789 73.2491L24.9415 78.4682C20.5455 78.9116 16.6224 75.7075 16.1789 71.3115L12.1642 31.5135C11.7208 27.1175 14.9249 23.1944 19.3209 22.7509L31.2603 21.5465C35.6563 21.1031 39.5794 24.3072 40.0228 28.7032L71.8613 25.4914Z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#fff"
                  fill-rule="evenodd"
                  d="M15.3209 18.751C10.925 19.1944 7.72082 23.1175 8.16427 27.5135L8.96721 35.4731L11.376 59.3519L12.179 67.3115C12.6224 71.7075 16.5456 74.9116 20.9415 74.4682L72.6789 69.2491C77.0749 68.8056 80.2791 64.8825 79.8356 60.4865L76.6238 28.6481C76.1804 24.2521 72.2573 21.048 67.8613 21.4914L36.0229 24.7032C35.5794 20.3072 31.6563 17.1031 27.2603 17.5465L15.3209 18.751Z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#000"
                  fill-rule="evenodd"
                  d="M6.17433 27.7142C5.62002 22.2193 9.6252 17.3154 15.1202 16.761L27.0596 15.5566C31.873 15.0711 36.233 18.0842 37.613 22.5326L67.6605 19.5015C73.1555 18.9472 78.0594 22.9524 78.6137 28.4474L81.8255 60.2858C82.3798 65.7807 78.3746 70.6846 72.8796 71.239L21.1422 76.4581C15.6473 77.0124 10.7434 73.0072 10.189 67.5122L6.17433 27.7142ZM67.8613 21.4914C72.2572 21.048 76.1803 24.2521 76.6238 28.6481L79.8356 60.4865C80.279 64.8825 77.0749 68.8056 72.6789 69.2491L20.9415 74.4682C16.5455 74.9116 12.6224 71.7075 12.1789 67.3115L8.16423 27.5135C7.72078 23.1175 10.9249 19.1944 15.3209 18.7509L27.2603 17.5465C31.6563 17.1031 35.5794 20.3072 36.0228 24.7032L67.8613 21.4914Z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#F8D044"
                  d="M18.8746 41.0976C19.6457 37.759 22.4573 35.2822 25.8665 34.9383L76.7102 29.8093C82.1624 29.2593 86.5411 34.2299 85.308 39.5692L79.6059 64.258C79.0276 66.762 76.9189 68.6196 74.362 68.8775L19.315 74.4305C15.2259 74.843 11.9418 71.1151 12.8667 67.1106L18.8746 41.0976Z"
                ></path>
                <path
                  fill="#000"
                  fill-rule="evenodd"
                  d="M17.9002 40.8726C18.7676 37.1167 21.9307 34.3302 25.766 33.9433L76.6098 28.8144C82.7435 28.1956 87.6695 33.7875 86.2822 39.7942L80.5801 64.4831C79.9054 67.4043 77.4453 69.5716 74.4623 69.8725L19.4153 75.4254C14.6446 75.9067 10.8133 71.5575 11.8923 66.8856L17.9002 40.8726ZM25.9668 35.9332C22.9837 36.2341 20.5236 38.4014 19.8489 41.3226L13.841 67.3356C13.0703 70.6727 15.8069 73.7793 19.2146 73.4355L74.2615 67.8826C76.3923 67.6676 78.1495 66.1196 78.6314 64.033L84.3335 39.3442C85.4125 34.6722 81.5812 30.323 76.8105 30.8043L25.9668 35.9332Z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#000"
                  fill-rule="evenodd"
                  d="M57.9949 38.4005C58.0498 38.95 57.6489 39.4401 57.0993 39.495L27.0993 42.495C26.5498 42.55 26.0597 42.149 26.0048 41.5995C25.9498 41.05 26.3508 40.5599 26.9003 40.505L56.9003 37.505C57.4499 37.45 57.9399 37.851 57.9949 38.4005Z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </span>
            <span className="flex flex-col">
              <span className="text-base capitalize">{folder.name}</span>
              <span className="text-[10px]">
                {dayjs(folder.createdAt).format("DD/MM/YYYY")}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-white">Recent Notes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>New Note</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
            </DialogHeader>
            <Addnotes setIsModalOpen={setIsFolderDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap gap-4 text-white mt-4">
        {notes?.map((folder) => (
          <div
            key={folder.id}
            onClick={() => navigate(`/folders/doodles/editor/${folder.id}`)}
            className="bg-black/70 rounded-2xl cursor-pointer hover:scale-105 transition-all w-[200px] h-[125px] px-4 flex flex-col justify-center items-start gap-2"
          >
            <span className="-ml-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 96 96"
                fill="none"
              >
                <path
                  d="M20 12C18 14 18 74 20 76C22 78 72 78 74 76C76 74 76 14 74 12C72 10 22 10 20 12Z"
                  fill="#F8D044"
                  stroke="#000"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  x1="28"
                  y1="28"
                  x2="68"
                  y2="30"
                  stroke="#000"
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <line
                  x1="28"
                  y1="40"
                  x2="68"
                  y2="42"
                  stroke="#000"
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <line
                  x1="28"
                  y1="52"
                  x2="64"
                  y2="54"
                  stroke="#000"
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <line
                  x1="28"
                  y1="64"
                  x2="52"
                  y2="66"
                  stroke="#000"
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <path
                  d="M34 10C34 6 34 4 38 4H58C62 4 62 6 62 10"
                  stroke="#000"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span className="flex flex-col">
              <span className="text-base capitalize">{folder.name}</span>
              <span className="text-[10px]">
                {dayjs(folder.createdAt).format("DD/MM/YYYY")}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notes;
