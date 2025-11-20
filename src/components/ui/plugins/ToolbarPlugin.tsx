import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { JSX, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  LexicalEditor,
  RangeSelection,
  LexicalNode,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  //   $isParentElementRTL,
  $wrapNodes,
  $isAtNodeEnd,
} from "@lexical/selection";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { createPortal } from "react-dom";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from "@lexical/rich-text";
import {
  $createCodeNode,
  $isCodeNode,
  getDefaultCodeLanguage,
  getCodeLanguages,
} from "@lexical/code";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Italic,
  Link,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Upload,
} from "lucide-react";
import { uploadApi } from "../../../api/upload.api";

const LowPriority = 1;

type BlockType = "paragraph" | "quote" | "code" | "h1" | "h2" | "ul" | "ol";

const supportedBlockTypes = new Set<BlockType>([
  "paragraph",
  "quote",
  "code",
  "h1",
  "h2",
  "ul",
  "ol",
]);

const blockTypeToBlockName: Record<string, string> = {
  code: "Code Block",
  h1: "Large Heading",
  h2: "Small Heading",
  h3: "Heading",
  h4: "Heading",
  h5: "Heading",
  ol: "Numbered List",
  paragraph: "Normal",
  quote: "Quote",
  ul: "Bulleted List",
};

function Divider(): JSX.Element {
  return <div className="divider w-px bg-gray-600 mx-1" />;
}

function positionEditorElement(
  editor: HTMLElement,
  rect: DOMRect | null
): void {
  if (rect === null) {
    editor.style.opacity = "0";
    editor.style.top = "-1000px";
    editor.style.left = "-1000px";
  } else {
    editor.style.opacity = "1";
    editor.style.top = `${rect.top + rect.height + window.pageYOffset + 10}px`;
    editor.style.left = `${
      rect.left + window.pageXOffset - editor.offsetWidth / 2 + rect.width / 2
    }px`;
  }
}

interface FloatingLinkEditorProps {
  editor: LexicalEditor;
}

function FloatingLinkEditor({ editor }: FloatingLinkEditorProps): JSX.Element {
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mouseDownRef = useRef<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [isEditMode, setEditMode] = useState<boolean>(false);
  const [lastSelection, setLastSelection] = useState<RangeSelection | null>(
    null
  );

  const updateLinkEditor = useCallback((): boolean => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL());
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl("");
      }
    }
    const editorElem = editorRef.current;
    const nativeSelection = window.getSelection();
    const activeElement = document.activeElement;

    if (editorElem === null) {
      return false;
    }

    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      nativeSelection &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const domRange = nativeSelection.getRangeAt(0);
      let rect: DOMRect;
      if (nativeSelection.anchorNode === rootElement) {
        let inner = rootElement;
        while (inner.firstElementChild != null) {
          inner = inner.firstElementChild as HTMLElement;
        }
        rect = inner.getBoundingClientRect();
      } else {
        rect = domRange.getBoundingClientRect();
      }

      if (!mouseDownRef.current) {
        positionEditorElement(editorElem, rect);
      }
      setLastSelection(selection as RangeSelection);
    } else if (!activeElement || activeElement.className !== "link-input") {
      positionEditorElement(editorElem, null);
      setLastSelection(null);
      setEditMode(false);
      setLinkUrl("");
    }

    return true;
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return true;
        },
        LowPriority
      )
    );
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkEditor();
    });
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    if (isEditMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditMode]);

  return (
    <div
      ref={editorRef}
      className="link-editor absolute z-50 top-[-10000px] left-[-10000px] mt-[-6px] max-w-[300px] w-full opacity-0 bg-white shadow-lg rounded-lg transition-opacity duration-500"
    >
      {isEditMode ? (
        <input
          ref={inputRef}
          className="link-input block w-full box-border m-3 p-3 rounded-2xl bg-gray-100 text-sm text-gray-800 border-0 outline-0 relative font-inherit"
          value={linkUrl}
          onChange={(event) => {
            setLinkUrl(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (lastSelection !== null) {
                if (linkUrl !== "") {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
                }
                setEditMode(false);
              }
            } else if (event.key === "Escape") {
              event.preventDefault();
              setEditMode(false);
            }
          }}
        />
      ) : (
        <>
          <div className="link-input block w-full box-border m-3 p-3 rounded-2xl bg-gray-100 text-sm text-gray-800 border-0 outline-0 relative font-inherit">
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 no-underline block whitespace-nowrap overflow-hidden mr-8 text-ellipsis hover:underline"
            >
              {linkUrl}
            </a>
            <div
              className="link-edit cursor-pointer absolute right-0 top-0 bottom-0 w-9"
              role="button"
              tabIndex={0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setEditMode(true);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

interface SelectProps {
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  className: string;
  options: string[];
  value: string;
}

function Select({
  onChange,
  className,
  options,
  value,
}: SelectProps): JSX.Element {
  return (
    <select className={className} onChange={onChange} value={value}>
      <option hidden={true} value="" />
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function getSelectedNode(selection: RangeSelection): LexicalNode {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}

interface BlockOptionsDropdownListProps {
  editor: LexicalEditor;
  blockType: string;
  toolbarRef: React.RefObject<HTMLDivElement>;
  setShowBlockOptionsDropDown: (show: boolean) => void;
}

function BlockOptionsDropdownList({
  editor,
  blockType,
  toolbarRef,
  setShowBlockOptionsDropDown,
}: BlockOptionsDropdownListProps): JSX.Element {
  const dropDownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    const dropDown = dropDownRef.current;

    if (toolbar !== null && dropDown !== null) {
      const { top, left } = toolbar.getBoundingClientRect();
      dropDown.style.top = `${top + 60}px`;
      dropDown.style.left = `${left + 800}px`;
    }
  }, [dropDownRef, toolbarRef]);

  useEffect(() => {
    const dropDown = dropDownRef.current;
    const toolbar = toolbarRef.current;

    if (dropDown !== null && toolbar !== null) {
      const handle = (event: MouseEvent) => {
        const target = event.target as Node;

        if (!dropDown.contains(target) && !toolbar.contains(target)) {
          setShowBlockOptionsDropDown(false);
        }
      };
      document.addEventListener("click", handle);

      return () => {
        document.removeEventListener("click", handle);
      };
    }
  }, [dropDownRef, setShowBlockOptionsDropDown, toolbarRef]);

  const formatParagraph = (): void => {
    if (blockType !== "paragraph") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createParagraphNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatLargeHeading = (): void => {
    if (blockType !== "h1") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h1"));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatSmallHeading = (): void => {
    if (blockType !== "h2") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h2"));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatBulletList = (): void => {
    if (blockType !== "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatNumberedList = (): void => {
    if (blockType !== "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatQuote = (): void => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createQuoteNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatCode = (): void => {
    if (blockType !== "code") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createCodeNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  return (
    <div
      className="dropdown absolute z-50 block bg-[#222] w-[200px] rounded-lg shadow-lg  min-h-[40px]"
      ref={dropDownRef}
    >
      <button
        className="item m-2 p-2 cursor-pointer text-[12px] flex items-center justify-start w-[185px] border-0  hover:bg-black/60 text-white rounded transition-colors"
        onClick={formatParagraph}
      >
        <span className="icon paragraph" />
        <span className="text">Normal</span>
        {blockType === "paragraph" && <span className="active" />}
      </button>
      <button
        className="item m-2 p-2 cursor-pointer text-[12px] flex items-center justify-start w-[185px] border-0  hover:bg-black/60 text-white rounded transition-colors"
        onClick={formatLargeHeading}
      >
        <span className="icon large-heading" />
        <span className="text">Large Heading</span>
        {blockType === "h1" && <span className="active" />}
      </button>
      <button
        className="item m-2 p-2 cursor-pointer text-[12px] flex items-center justify-start w-[185px] border-0  hover:bg-black/60 text-white rounded transition-colors"
        onClick={formatSmallHeading}
      >
        <span className="icon small-heading" />
        <span className="text">Small Heading</span>
        {blockType === "h2" && <span className="active" />}
      </button>
      <button
        className="item m-2 p-2 cursor-pointer text-[12px] flex items-center justify-start w-[185px] border-0  hover:bg-black/60 text-white rounded transition-colors"
        onClick={formatBulletList}
      >
        <span className="icon bullet-list" />
        <span className="text">Bullet List</span>
        {blockType === "ul" && <span className="active" />}
      </button>
      <button
        className="item m-2 p-2 cursor-pointer text-[12px] flex items-center justify-start w-[185px] border-0  hover:bg-black/60 text-white rounded transition-colors"
        onClick={formatNumberedList}
      >
        <span className="icon numbered-list" />
        <span className="text">Numbered List</span>
        {blockType === "ol" && <span className="active" />}
      </button>
      <button
        className="item m-2 p-2 cursor-pointer text-[12px] flex items-center justify-start w-[185px] border-0  hover:bg-black/60 text-white rounded transition-colors"
        onClick={formatQuote}
      >
        <span className="icon quote" />
        <span className="text">Quote</span>
        {blockType === "quote" && <span className="active" />}
      </button>
      <button
        className="item m-2 p-2 cursor-pointer text-[12px] flex items-center justify-start w-[185px] border-0  hover:bg-black/60 text-white rounded transition-colors"
        onClick={formatCode}
      >
        <span className="icon code" />
        <span className="text">Code Block</span>
        {blockType === "code" && <span className="active" />}
      </button>
    </div>
  );
}

export default function ToolbarPlugin({
  setShowDoodle,
  showDoodle,
  title,
}: {
  setShowDoodle: (show: boolean) => void;
  showDoodle: boolean;
  title?: string;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [blockType, setBlockType] = useState<string>("paragraph");
  const [selectedElementKey, setSelectedElementKey] = useState<string | null>(
    null
  );
  const [showBlockOptionsDropDown, setShowBlockOptionsDropDown] =
    useState<boolean>(false);
  const [codeLanguage, setCodeLanguage] = useState<string>("");
  //   const [isRTL, setIsRTL] = useState<boolean>(false);
  const [isLink, setIsLink] = useState<boolean>(false);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [isStrikethrough, setIsStrikethrough] = useState<boolean>(false);
  const [isCode, setIsCode] = useState<boolean>(false);

  const updateToolbar = useCallback((): void => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type);
          if ($isCodeNode(element)) {
            setCodeLanguage(element.getLanguage() || getDefaultCodeLanguage());
          }
        }
      }
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));
      //   setIsRTL($isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload: boolean) => {
          setCanUndo(payload);
          return true; // Changed from false to true
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload: boolean) => {
          setCanRedo(payload);
          return true; // Changed from false to true
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  const codeLanguages = useMemo(() => getCodeLanguages(), []);
  const onCodeLanguageSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>): void => {
      editor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(e.target.value);
          }
        }
      });
    },
    [editor, selectedElementKey]
  );

  const insertLink = useCallback((): void => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  return (
    <div
      className="toolbar flex mb-1 gap-1  p-2 justify-end items-center"
      ref={toolbarRef}
    >
      <h1 className="text-2xl font-bold mr-auto" contentEditable>
        {title}
      </h1>
      <button
        onClick={() => setShowDoodle(!showDoodle)}
        className="toolbar-item spaced p-2 rounded-lg hover:bg-black/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Doodle"
      >
        Doodle
      </button>
      <button
        disabled={!canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        className="toolbar-item spaced p-2 rounded-lg hover:bg-black/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Undo"
      >
        <Undo2 size={16} color="white" />
      </button>
      <button
        disabled={!canRedo}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        className="toolbar-item p-2 rounded-lg hover:bg-black/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Redo"
      >
        <Redo2 size={16} color="white" />
      </button>
      <Divider />
      {supportedBlockTypes.has(blockType as BlockType) && (
        <>
          <button
            className="toolbar-item block-controls p-2 rounded-lg hover:bg-black/60 transition-colors flex items-center gap-2"
            onClick={() =>
              setShowBlockOptionsDropDown(!showBlockOptionsDropDown)
            }
            aria-label="Formatting Options"
          >
            <span className={"icon block-type " + blockType} />
            <span className="text text-sm text-white">
              {blockTypeToBlockName[blockType]}
            </span>
            <i className="chevron-down" />
          </button>
          {showBlockOptionsDropDown &&
            createPortal(
              <BlockOptionsDropdownList
                editor={editor}
                blockType={blockType}
                toolbarRef={toolbarRef as React.RefObject<HTMLDivElement>}
                setShowBlockOptionsDropDown={setShowBlockOptionsDropDown}
              />,
              document.body
            )}
          <Divider />
        </>
      )}
      {blockType === "code" ? (
        <>
          <Select
            className="toolbar-item code-language p-2 rounded-lg bg-white border border-gray-300 text-sm"
            onChange={onCodeLanguageSelect}
            options={codeLanguages}
            value={codeLanguage}
          />
          <i className="chevron-down inside" />
        </>
      ) : (
        <>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
            className={
              "toolbar-item spaced p-2 rounded-lg hover:bg-black/60 transition-colors" +
              (isBold ? " bg-[#414141] text-blue-700" : " text-gray-700")
            }
            aria-label="Format Bold"
          >
            <Bold size={16} color="white" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            }}
            className={
              "toolbar-item spaced p-2 rounded-lg hover:bg-black/60 transition-colors" +
              (isItalic ? " bg-[#414141] text-blue-700" : " text-gray-700")
            }
            aria-label="Format Italics"
          >
            <Italic size={16} color="white" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
            }}
            className={
              "toolbar-item spaced p-2 rounded-lg hover:bg-black/60 transition-colors" +
              (isUnderline ? " bg-[#414141] text-blue-700" : " text-gray-700")
            }
            aria-label="Format Underline"
          >
            <Underline size={16} color="white" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
            }}
            className={
              "toolbar-item spaced p-2 rounded-lg hover:bg-black/60 transition-colors" +
              (isStrikethrough
                ? " bg-[#414141] text-blue-700"
                : " text-gray-700")
            }
            aria-label="Format Strikethrough"
          >
            <Strikethrough size={16} color="white" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
            }}
            className={
              "toolbar-item spaced p-2 rounded-lg hover:bg-black/60 transition-colors" +
              (isCode ? " bg-[#414141] text-blue-700" : " text-gray-700")
            }
            aria-label="Insert Code"
          >
            <Code size={16} color="white" />
          </button>
          <button
            onClick={insertLink}
            className={
              "toolbar-item spaced p-2 rounded-lg hover:bg-black/60 transition-colors" +
              (isLink ? " bg-[#414141] text-blue-700" : " text-gray-700")
            }
            aria-label="Insert Link"
          >
            <Link size={16} color="white" />
          </button>
          {isLink &&
            createPortal(<FloatingLinkEditor editor={editor} />, document.body)}
          <Divider />
          <button
            onClick={() => {
              // Create a file input for upload
              const fileInput = document.createElement("input");
              fileInput.type = "file";
              fileInput.accept = "image/*,video/*";
              fileInput.style.display = "none";
              document.body.appendChild(fileInput);

              fileInput.onchange = async (event) => {
                const target = event.target as HTMLInputElement;
                const files = target.files;
                console.log(files);
                
                if (files && files.length > 0) {
                  const file = files[0];
                  const isImage = file.type.startsWith("image/");
                  const isVideo = file.type.startsWith("video/");

                  if (isImage || isVideo) {
                    try {
                      const uploadResponse = await uploadApi.uploadFile(file);
                      console.log(uploadResponse);
                      
                      // Insert the media into the editor
                      editor.update(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                          const paragraphNode = $createParagraphNode();
                          const textNode = $createTextNode("");
                          paragraphNode.append(textNode);
                          selection.insertNodes([paragraphNode]);

                          const range = document.createRange();
                          const paragraphElement = editor.getElementByKey(
                            paragraphNode.getKey()
                          );
                          if (paragraphElement) {
                            range.selectNodeContents(paragraphElement);
                            range.collapse(false);
                            console.log(isImage);
                            
                            if (isImage) {
                              const imgElement = document.createElement("img");
                              imgElement.src = uploadResponse.imageUrl;
                              imgElement.alt = file.name;
                              imgElement.style.maxWidth = "100%";
                              imgElement.style.height = "auto";
                              imgElement.style.margin = "8px 0";
                              imgElement.style.borderRadius = "4px";
                              range.insertNode(imgElement);
                            } else if (isVideo) {
                              const videoElement =
                                document.createElement("video");
                              videoElement.src = uploadResponse.imageUrl;
                              videoElement.controls = true;
                              videoElement.style.maxWidth = "100%";
                              videoElement.style.height = "auto";
                              videoElement.style.margin = "8px 0";
                              videoElement.style.borderRadius = "4px";
                              videoElement.title = file.name;
                              range.insertNode(videoElement);
                            }
                          }
                        }
                      });
                    } catch (error) {
                      console.error("Upload failed:", error);
                      alert("Failed to upload file. Please try again.");
                    }
                  }
                }

                // Clean up
                document.body.removeChild(fileInput);
              };

              fileInput.click();
            }}
            className="toolbar-item spaced p-2 rounded-lg hover:bg-black/60 transition-colors text-gray-700"
            aria-label="Upload Media"
          >
            <Upload size={16} color="white" />
          </button>
          <Divider />
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
            }}
            className="toolbar-item spaced p-2 rounded-lg hover:bg-black/60 transition-colors text-gray-700"
            aria-label="Left Align"
          >
            <AlignLeft size={16} color="white" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
            }}
            className="toolbar-item spaced p-2 rounded-lg hover:bg-black/60 transition-colors text-gray-700"
            aria-label="Center Align"
          >
            <AlignCenter size={16} color="white" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
            }}
            className="toolbar-item spaced p-2 rounded-lg hover:bg-black/60 transition-colors text-gray-700"
            aria-label="Right Align"
          >
            <AlignRight size={16} color="white" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
            }}
            className="toolbar-item p-2 rounded-lg hover:bg-black/60 transition-colors text-gray-700"
            aria-label="Justify Align"
          >
            <AlignJustify size={16} color="white" />
          </button>{" "}
        </>
      )}
    </div>
  );
}
