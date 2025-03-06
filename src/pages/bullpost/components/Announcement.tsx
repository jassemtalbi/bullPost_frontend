import React, { useEffect } from "react";
import { TextField, useTheme, useMediaQuery } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";


interface AnnouncementProps {
  text: string;
  setText: (value: string) => void;
  inputRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;

}

const Announcement: React.FC<AnnouncementProps> = ({ text, setText, inputRef }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const selectedAnnouncement = useSelector((state: RootState) => state.posts.selectedAnnouncement);

  useEffect(() => {
    if (selectedAnnouncement && selectedAnnouncement.length > 0) {
      setText(selectedAnnouncement[0].prompt);
    }
  }, [selectedAnnouncement, setText]);


  return (
    <TextField
      fullWidth
      multiline
      rows={isMobile ? 6 : 4}
      variant="outlined"
      placeholder="Write your announcement..."
      value={text}
      onChange={(e) => setText(e.target.value)}
      // onBlur={handleBlur}
      inputRef={inputRef}

      sx={{
        mt: isMobile ? "10px" : "0",
        width: isMobile ? "100%" : "50%",
        textarea: {
          color: "#fff",
          textAlign: "center",
          fontSize: "14px",
        },
        "& .MuiOutlinedInput-input": {
          // Force vertical scrolling inside the textarea
          overflowY: "auto",

          /* Scrollbar styling for WebKit/Blink browsers (Chrome, Safari, etc.) */
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#FFB300", // gold thumb
            borderRadius: "3px",
          },

          // Optional: hide scrollbar track if you want
          // "&::-webkit-scrollbar-track": {
          //   backgroundColor: "transparent",
          // },
        },

        /* The rest of your styling... */
        "& .MuiOutlinedInput-root": {
          borderRadius: "10px",
          "& fieldset": { borderColor: "#333" },
          "&:hover fieldset": { borderColor: "#444" },
        },
      }}
    />
  );
};

export default Announcement;
