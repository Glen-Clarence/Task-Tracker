import { Input } from "../ui/input";
import Editor from "../editors/Lexical";

const NewIssue = () => {
  return (
    <div className="text-white">
      <h4 className="text-2xl font-normal mb-4">Add a new issue</h4>

      <div className="grid grid-cols-12">
        <div className="col-span-8">
          <div className="flex flex-col gap-2">
            <label htmlFor="issue">Add a title</label>
            <Input placeholder="Enter Your Issue" />
          </div>
          <div>
            <Editor
              setShowDoodle={() => {}}
              showDoodle={false}
              updateContent={() => {}}
              //   title={"Add a description"}
            />
          </div>
        </div>
        <div className="col-span-4"></div>
      </div>
    </div>
  );
};

export default NewIssue;
