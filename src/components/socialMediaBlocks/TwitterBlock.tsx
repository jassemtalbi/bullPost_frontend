import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Typography,
    Switch,
    Avatar,
    Button,
    IconButton,
    TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
    ArrowDropDownCircleOutlined,
    AutoAwesome,
    Edit,
    InsertPhoto,
    Mood,
    Replay,
} from "@mui/icons-material";
import TwitterIcon from "@mui/icons-material/Twitter";
import Done from "@mui/icons-material/Done";
import { useAuth } from "@/hooks/useAuth";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { updatePost } from "@/store/slices/postsSlice";
import dayjs from "dayjs";

interface TwitterBlockProps {
    submittedText: string; // Accept submitted text as a prop
    _id: string;
    onSubmit: () => void; // ✅ Accept API submit function

}
// 1) Define mappings for bold & italic letters
// (Uppercase, Lowercase)
const BOLD_UPPER = "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭";
const BOLD_LOWER = "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇";
const ITALIC_UPPER = "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍";
const ITALIC_LOWER = "𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧";
const REG_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const REG_LOWER = "abcdefghijklmnopqrstuvwxyz";

// 2) Helper functions to transform text
function toBold(text: string): string {
    let result = "";
    for (const char of text) {
        if (REG_UPPER.includes(char)) {
            // Bold uppercase
            const index = REG_UPPER.indexOf(char);
            result += BOLD_UPPER[index];
        } else if (REG_LOWER.includes(char)) {
            // Bold lowercase
            const index = REG_LOWER.indexOf(char);
            result += BOLD_LOWER[index];
        } else {
            result += char; // unchanged
        }
    }
    return result;
}

function toItalic(text: string): string {
    let result = "";
    for (const char of text) {
        if (REG_UPPER.includes(char)) {
            const index = REG_UPPER.indexOf(char);
            result += ITALIC_UPPER[index];
        } else if (REG_LOWER.includes(char)) {
            const index = REG_LOWER.indexOf(char);
            result += ITALIC_LOWER[index];
        } else {
            result += char;
        }
    }
    return result;
}

// Underline & strikethrough rely on combining characters
// Each character is followed by the combining mark.
function toUnderline(text: string): string {
    // Combining low line = \u0332
    return text
        .split("")
        .map((char) => char + "\u0332")
        .join("");
}

function toStrikethrough(text: string): string {
    // Combining long stroke overlay = \u0336
    return text
        .split("")
        .map((char) => char + "\u0336")
        .join("");
}
const TwitterBlock: React.FC<TwitterBlockProps> = ({ submittedText, onSubmit, _id }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
    const [displayText, setDisplayText] = useState("");
    const indexRef = useRef(0);
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);
    const { user } = useAuth();
    const selectedAnnouncement = useSelector(
        (state: RootState) => state.posts.selectedAnnouncement
    );
    const dispatch = useDispatch<AppDispatch>();

    // State for editing mode and editable text
    const [isEditing, setIsEditing] = useState(false);
    const [editableText, setEditableText] = useState("");

    // Animate text when not in editing mode
    useEffect(() => {
        if (!submittedText || isEditing) {
            setDisplayText("");
            indexRef.current = 0;
            return;
        }
        setDisplayText(submittedText[0] || "");
        indexRef.current = 1;
        const typeNextCharacter = () => {
            if (indexRef.current < submittedText.length) {
                const nextChar = submittedText[indexRef.current];
                if (nextChar !== undefined) {
                    setDisplayText((prev) => prev + nextChar);
                    indexRef.current += 1;
                    typingTimeout.current = setTimeout(typeNextCharacter, 30);
                }
            }
        };
        typingTimeout.current = setTimeout(typeNextCharacter, 30);
        return () => {
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
        };
    }, [submittedText, isEditing]);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const handleUpdate = async () => {
        try {
            const formData = new FormData();
            formData.append("twitter", editableText);
            if (selectedImage) {
                formData.append("image_twitter", selectedImage); // "image" is the key expected by your API
            }
            const updatedPost = await dispatch(
                updatePost({
                    id: selectedAnnouncement[0]._id,
                    body: formData,
                })
            ).unwrap();
            // Use the updated post's twitter field if available, otherwise fall back to editableText
            setDisplayText(updatedPost?.twitter || editableText);
        } catch (error) {
            console.error("Error updating post:", error);
        } finally {
            setIsEditing(false);
        }
    };
    const textFieldRef = useRef<HTMLTextAreaElement | null>(null);
    const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);

    // Mouse event handler: set popover position if text is selected
    const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        if (!textFieldRef.current) return;
        const start = textFieldRef.current.selectionStart;
        const end = textFieldRef.current.selectionEnd;
        if (start !== end) {
            setAnchorPosition({ top: e.clientY, left: e.clientX });
        } else {
            setAnchorPosition(null);
        }
    };

    // Keyboard event handler: set fallback popover position if text is selected
    const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!textFieldRef.current) return;
        const start = textFieldRef.current.selectionStart;
        const end = textFieldRef.current.selectionEnd;
        if (start !== end) {
            // For keyboard events, we use a fixed fallback position
            setAnchorPosition({ top: 100, left: 100 });
        } else {
            setAnchorPosition(null);
        }
    };

    // Handle formatting by transforming the selected text with the chosen style
    const handleFormat = (formatType: string) => {
        if (!textFieldRef.current) return;
        const field = textFieldRef.current;
        const start = field.selectionStart;
        const end = field.selectionEnd;
        if (start == null || end == null || start === end) return;

        const selected = editableText.substring(start, end);
        let transformed = selected;

        switch (formatType) {
            case "bold":
                transformed = toBold(selected);
                break;
            case "italic":
                transformed = toItalic(selected);
                break;
            case "underline":
                transformed = toUnderline(selected);
                break;
            case "strike":
                transformed = toStrikethrough(selected);
                break;
            default:
                break;
        }

        const newText =
            editableText.slice(0, start) + transformed + editableText.slice(end);
        setEditableText(newText);

        // Hide the popover and restore focus
        setAnchorPosition(null);
        setTimeout(() => field.focus(), 0);
    };

    return (
        <>
            <Box
                sx={{
                    flex: 1,
                    backgroundImage: "url('/XColor.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "top",
                    backgroundColor: "#111112",
                    p: 2,
                    border: "1px solid #3C3C3C",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: isMobile ? "500px" : "400px",
                    maxHeight: isMobile ? "500px" : "400px",
                    flexShrink: 0,
                    width: "100%",
                    mt: isMobile ? "10px" : "0",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <TwitterIcon fontSize="large" sx={{ color: "#1DA1F2" }} />
                    {user && (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                padding: "4px 10px",
                                border: "1px solid #3C3C3C",
                                borderRadius: "20px",
                                backgroundColor: "#0F0F0F",
                            }}
                        >
                            <Avatar
                                src="/mnt/data/image.png"
                                alt="Julio"
                                sx={{ width: 26, height: 26 }}
                            />
                            <Typography sx={{ color: "#8F8F8F", fontSize: "14px", fontWeight: 500 }}>
                                @{user.userName}
                            </Typography>
                            <ArrowDropDownCircleOutlined sx={{ color: "#8F8F8F", fontSize: 18 }} />
                        </Box>
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    <Switch color="warning" sx={{ transform: "scale(0.9)" }} />
                </Box>

                <Box
                    sx={{
                        textAlign: "justify",
                        width: "100%",
                        padding: 2,
                        mt: 2,
                        flexGrow: 1,
                        maxHeight: isMobile ? "400px" : "200px",
                        overflowY: "auto",
                        "&::-webkit-scrollbar": {
                            width: "4px", // smaller scrollbar width
                        },
                        "&::-webkit-scrollbar-thumb": {
                            backgroundColor: "#FFB300", // gold scrollbar thumb
                            borderRadius: "3px",
                        },
                    }}
                >
                    {isEditing ? (
                        <Box>

                            <TextField
                                fullWidth
                                multiline
                                variant="outlined"
                                value={editableText}
                                onChange={(e) => setEditableText(e.target.value)}
                                sx={{
                                    "& .MuiOutlinedInput-input": { color: "#8F8F8F", fontSize: "14px" },
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "10px",
                                        "& fieldset": { borderColor: "#333" },
                                        "&:hover fieldset": { borderColor: "#444" },
                                    },
                                }}
                            />
                            {selectedImage && (
                                <Box mb={2} textAlign="center">
                                    <img
                                        src={URL.createObjectURL(selectedImage)}
                                        alt="Image preview"
                                        style={{
                                            width: "100%",
                                            marginTop: "10px",
                                            maxHeight: "200px",
                                            objectFit: "contain",
                                            borderRadius: "4px",
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>

                    ) : (
                        <>
                            {selectedAnnouncement && selectedAnnouncement.length > 0 && selectedAnnouncement[0]?.image_twitter &&
                                <img
                                    src={selectedAnnouncement && selectedAnnouncement.length > 0 ? selectedAnnouncement[0]?.image_twitter : "/mnt/data/image.png"}
                                    alt="Preview"
                                    style={{ maxWidth: "100%", display: "block", margin: "0 auto", marginBottom: "10px" }}
                                />
                            }
                            <Typography sx={{ fontSize: "14px", color: "#8F8F8F", whiteSpace: "pre-line" }}>
                                {selectedAnnouncement && selectedAnnouncement.length > 0
                                    ? selectedAnnouncement[0].twitter
                                    : (displayText || "No announcement yet...")}
                            </Typography>
                        </>
                    )}
                </Box>

                {user && (
                    <>
                        <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column", mt: 2, gap: 1 }}>
                            {/* Toolbar Section */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    backgroundColor: "#191919",
                                    borderRadius: "30px",
                                    padding: "8px 15px",
                                    border: "1px solid #3C3C3C",
                                    width: "fit-content",
                                }}
                            >
                                <IconButton
                                    sx={{ color: "#8F8F8F" }}
                                    onClick={() => {
                                        if (!isEditing) {
                                            // Enter edit mode: load current twitter text
                                            const currentText =
                                                selectedAnnouncement && selectedAnnouncement.length > 0
                                                    ? selectedAnnouncement[0].twitter
                                                    : displayText;
                                            setEditableText(currentText);
                                            setIsEditing(true);
                                        } else {
                                            // When done is clicked, dispatch updatePost from slice
                                            handleUpdate();
                                        }
                                    }}
                                >
                                    {isEditing ? <Done fontSize="small" /> : <Edit fontSize="small" />}
                                </IconButton>
                                <IconButton sx={{ color: "#8F8F8F" }}>
                                    <Mood fontSize="small" />
                                </IconButton>
                                <IconButton component="label" sx={{ color: "#8F8F8F" }}>
                                    <InsertPhoto fontSize="small" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setSelectedImage(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </IconButton>
                                <IconButton sx={{ color: "#8F8F8F" }}>
                                    <AutoAwesome fontSize="small" />
                                </IconButton>
                                <Box sx={{ width: "1px", height: "20px", backgroundColor: "#555", mx: 1 }} />
                                <IconButton sx={{ color: "red" }}>
                                    <Replay fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Bottom Button Section */}
                        {!isMobile && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                                <Button
                                    sx={{
                                        backgroundColor: "#FFB300",
                                        width: 40,
                                        height: 40,
                                        borderRadius: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minWidth: "auto",
                                        "&:hover": { backgroundColor: "#FFA500" },
                                    }}
                                >
                                    <img src="/calendar_month.png" alt="Calendar" />
                                </Button>
                                <Button
                                    sx={{
                                        backgroundColor: "#191919",
                                        color: "#666",
                                        borderRadius: "12px",
                                        height: 50,
                                        flex: 1,
                                        width: "150px",
                                        "&:hover": { backgroundColor: "#222" },
                                    }}
                                >
                                    Post Now
                                </Button>
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </>
    );
};

export default TwitterBlock;
