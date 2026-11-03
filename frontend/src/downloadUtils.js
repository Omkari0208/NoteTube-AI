import { jsPDF } from "jspdf";

import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
} from "docx";

import pptxgen from "pptxgenjs";


/* =========================================================
   BASIC HELPERS
========================================================= */

const safeFileName = (name) => {
  return String(
    name || "NoteTube-AI-Study-Material"
  )
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 100);
};


const valueToText = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map(valueToText)
      .join("\n");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(
        ([key, val]) =>
          `${key}: ${valueToText(val)}`
      )
      .join("\n");
  }

  return String(value);
};


const questionToText = (
  item,
  index,
  showAnswers = true
) => {
  if (typeof item === "string") {
    return `${index + 1}. ${item}`;
  }

  if (
    !item ||
    typeof item !== "object"
  ) {
    return `${index + 1}. ${valueToText(
      item
    )}`;
  }

  let text = "";

  if (item.question) {
    text += `Q${index + 1}. ${valueToText(
      item.question
    )}\n`;
  }

  if (item.term) {
    text += `${valueToText(
      item.term
    )}\n`;

    if (item.definition) {
      text += `${valueToText(
        item.definition
      )}\n`;
    }
  }

  if (item.concept) {
    text += `${valueToText(
      item.concept
    )}\n`;

    if (item.description) {
      text += `${valueToText(
        item.description
      )}\n`;
    }
  }

  if (Array.isArray(item.options)) {
    item.options.forEach(
      (option, optionIndex) => {
        text += `${String.fromCharCode(
          65 + optionIndex
        )}. ${valueToText(
          option
        )}\n`;
      }
    );
  }

  if (
    showAnswers &&
    item.answer
  ) {
    text += `Answer: ${valueToText(
      item.answer
    )}\n`;
  }

  return text.trim();
};


/* =========================================================
   PDF DESIGN
========================================================= */

const PDF = {
  pageWidth: 210,
  pageHeight: 297,

  marginLeft: 25,
  marginRight: 18,
  marginTop: 22,
  marginBottom: 20,

  borderX: 7,
  borderWidth: 4,

  titleSize: 23,
  headingSize: 17,
  subHeadingSize: 12.5,

  bodySize: 10.5,
  bulletSize: 10.5,

  bodyLineHeight: 5.3,
  bulletLineHeight: 5.3,
};


/* =========================================================
   FIX LETTER SPACING
========================================================= */

const cleanPdfText = (input) => {
  if (
    input === null ||
    input === undefined
  ) {
    return "";
  }

  let text = String(input)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");


  /*
     Detect text such as:

     T h e v i d e o s t a r t s

     and convert it to:

     The video starts
  */

  const lines = text.split("\n");


  const fixedLines = lines.map(
    (line) => {

      const trimmed =
        line.trim();

      if (!trimmed) {
        return "";
      }


      const tokens =
        trimmed.split(/\s+/);


      const singleLetters =
        tokens.filter(
          (token) =>
            /^[A-Za-z]$/.test(
              token
            )
        ).length;


      /*
         Only repair a line if it
         clearly contains letter-by-letter
         spacing.
      */

      const letterSpacingDetected =
        singleLetters >= 4 &&
        singleLetters /
          tokens.length >=
          0.35;


      if (
        !letterSpacingDetected
      ) {
        return trimmed;
      }


      /*
         Rebuild the words.
      */

      const output = [];

      let currentWord = "";


      tokens.forEach(
        (token) => {

          if (
            /^[A-Za-z]$/.test(
              token
            )
          ) {
            currentWord += token;
          } else {

            if (currentWord) {
              output.push(
                currentWord
              );

              currentWord = "";
            }

            output.push(token);
          }
        }
      );


      if (currentWord) {
        output.push(
          currentWord
        );
      }


      return output.join(" ");
    }
  );


  text =
    fixedLines.join("\n");


  /*
     Technical terms that may also
     arrive with spaces.
  */

  const replacements = {
    "A W S": "AWS",
    "E C 2": "EC2",
    "S 3": "S3",

    "I a a S": "IaaS",
    "P a a S": "PaaS",
    "S a a S": "SaaS",

    "V M w a r e": "VMware",

    "o n p r e m i s e s":
      "on premises",

    "o f f p r e m i s e s":
      "off premises",

    "p a y a s y o u g o":
      "pay as you go",

    "s e r v i c e m o d e l s":
      "service models",

    "c l o u d c o m p u t i n g":
      "cloud computing",

    "c l o u d p r o v i d e r s":
      "cloud providers",

    "c l o u d s e r v i c e s":
      "cloud services",
  };


  Object.entries(
    replacements
  ).forEach(
    ([wrong, correct]) => {
      text =
        text.replaceAll(
          wrong,
          correct
        );
    }
  );


  /*
     Final spacing cleanup.
  */

  text = text
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();


  return text;
};


/* =========================================================
   IMPORTANT TERMS
========================================================= */

const importantTerms = [
  "AWS",
  "EC2",
  "S3",
  "IaaS",
  "PaaS",
  "SaaS",

  "cloud computing",
  "cloud services",

  "public cloud",
  "private cloud",
  "hybrid cloud",

  "deployment models",
  "service models",

  "security",
  "scalability",
  "availability",
  "reliability",

  "pay as you go",

  "benefits",
  "advantages",
  "disadvantages",

  "simple example",
  "example",

  "definition",
  "answer",

  "important points",
  "key concepts",
];


/* =========================================================
   CHECK WHETHER WORD SHOULD BE BOLD
========================================================= */

const isImportantWord = (word) => {
  const clean =
    word
      .toLowerCase()
      .replace(
        /[.,!?;:()[\]{}]/g,
        ""
      );

  return importantTerms.some(
    (term) => {

      const cleanTerm =
        term
          .toLowerCase()
          .replace(
            /[.,!?;:()[\]{}]/g,
            ""
          );

      return (
        clean === cleanTerm ||
        clean.includes(cleanTerm)
      );
    }
  );
};


/* =========================================================
   PAGE DESIGN
========================================================= */

const drawPageDesign = (
  pdf
) => {

  /*
     Very light professional background.
  */

  pdf.setFillColor(
    248,
    247,
    239
  );

  pdf.rect(
    0,
    0,
    PDF.pageWidth,
    PDF.pageHeight,
    "F"
  );


  /*
     Dark left border.
  */

  pdf.setFillColor(
    30,
    32,
    26
  );

  pdf.rect(
    PDF.borderX,
    0,
    PDF.borderWidth,
    PDF.pageHeight,
    "F"
  );


  /*
     Make sure there is never
     character spacing.
  */

  if (
    typeof pdf.setCharSpace ===
    "function"
  ) {
    pdf.setCharSpace(0);
  }
};


/* =========================================================
   PAGE NUMBER
========================================================= */

const addPageNumber = (
  pdf
) => {

  const page =
    pdf.getCurrentPageInfo()
      .pageNumber;

  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(8);

  pdf.setTextColor(
    120,
    120,
    120
  );

  pdf.text(
    `Page ${page}`,
    PDF.pageWidth -
      PDF.marginRight,
    PDF.pageHeight - 9,
    {
      align: "right",
    }
  );
};


/* =========================================================
   PAGE CHECK
========================================================= */

const checkPage = (
  pdf,
  y,
  requiredHeight
) => {

  if (
    y + requiredHeight >
    PDF.pageHeight -
      PDF.marginBottom
  ) {

    pdf.addPage();

    drawPageDesign(pdf);

    return PDF.marginTop;
  }

  return y;
};


/* =========================================================
   DRAW NORMAL TEXT + BOLD KEYWORDS
========================================================= */

const drawRichText = (
  pdf,
  text,
  x,
  y,
  width
) => {

  const cleaned =
    cleanPdfText(text);

  if (!cleaned) {
    return y;
  }


  const words =
    cleaned.split(/\s+/);


  let currentLine = [];

  let currentWidth = 0;


  pdf.setFontSize(
    PDF.bodySize
  );


  const getWidth = (
    word,
    bold
  ) => {

    pdf.setFont(
      "helvetica",
      bold
        ? "bold"
        : "normal"
    );

    return pdf.getTextWidth(
      word
    );
  };


  words.forEach(
    (word) => {

      const bold =
        isImportantWord(
          word
        );


      const wordWidth =
        getWidth(
          word,
          bold
        );


      const spaceWidth =
        getWidth(
          " ",
          false
        );


      const proposedWidth =
        currentWidth +
        wordWidth +
        (
          currentLine.length
            ? spaceWidth
            : 0
        );


      /*
         Start a new line if needed.
      */

      if (
        currentLine.length &&
        proposedWidth > width
      ) {

        y =
          checkPage(
            pdf,
            y,
            PDF.bodyLineHeight
          );


        let lineX = x;


        currentLine.forEach(
          (item, index) => {

            pdf.setFont(
              "helvetica",
              item.bold
                ? "bold"
                : "normal"
            );

            pdf.setFontSize(
              PDF.bodySize
            );

            pdf.setTextColor(
              45,
              45,
              42
            );


            if (
              typeof pdf.setCharSpace ===
              "function"
            ) {
              pdf.setCharSpace(0);
            }


            pdf.text(
              item.word,
              lineX,
              y
            );


            lineX +=
              pdf.getTextWidth(
                item.word
              );


            if (
              index <
              currentLine.length - 1
            ) {

              lineX +=
                pdf.getTextWidth(
                  " "
                );
            }
          }
        );


        y +=
          PDF.bodyLineHeight;


        currentLine = [
          {
            word,
            bold,
          },
        ];


        currentWidth =
          wordWidth;

      } else {

        currentLine.push({
          word,
          bold,
        });


        currentWidth =
          proposedWidth;
      }
    }
  );


  /*
     Last line.
  */

  if (
    currentLine.length
  ) {

    y =
      checkPage(
        pdf,
        y,
        PDF.bodyLineHeight
      );


    let lineX = x;


    currentLine.forEach(
      (item, index) => {

        pdf.setFont(
          "helvetica",
          item.bold
            ? "bold"
            : "normal"
        );

        pdf.setFontSize(
          PDF.bodySize
        );

        pdf.setTextColor(
          45,
          45,
          42
        );


        if (
          typeof pdf.setCharSpace ===
          "function"
        ) {
          pdf.setCharSpace(0);
        }


        pdf.text(
          item.word,
          lineX,
          y
        );


        lineX +=
          pdf.getTextWidth(
            item.word
          );


        if (
          index <
          currentLine.length - 1
        ) {

          lineX +=
            pdf.getTextWidth(
              " "
            );
        }
      }
    );


    y +=
      PDF.bodyLineHeight;
  }


  return y;
};


/* =========================================================
   NORMAL PARAGRAPH
========================================================= */

const addParagraph = (
  pdf,
  text,
  y
) => {

  const cleaned =
    cleanPdfText(text);

  if (!cleaned) {
    return y;
  }


  const paragraphs =
    cleaned.split(
      /\n\s*\n/
    );


  paragraphs.forEach(
    (paragraph) => {

      const content =
        paragraph
          .replace(/\n/g, " ")
          .replace(
            /\s+/g,
            " "
          )
          .trim();


      if (!content) {
        return;
      }


      y =
        checkPage(
          pdf,
          y,
          PDF.bodyLineHeight
        );


      y =
        drawRichText(
          pdf,
          content,
          PDF.marginLeft,
          y,
          PDF.pageWidth -
            PDF.marginLeft -
            PDF.marginRight
        );


      /*
         Small professional gap.
      */

      y += 3;
    }
  );


  return y;
};


/* =========================================================
   MAIN HEADING
========================================================= */

const addMainHeading = (
  pdf,
  text,
  y
) => {

  const heading =
    cleanPdfText(text)
      .replace(
        /^#{1,6}\s*/,
        ""
      )
      .trim();


  if (!heading) {
    return y;
  }


  y =
    checkPage(
      pdf,
      y,
      15
    );


  /*
     Large bold heading.
  */

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(
    PDF.headingSize
  );

  pdf.setTextColor(
    28,
    30,
    25
  );


  if (
    typeof pdf.setCharSpace ===
    "function"
  ) {
    pdf.setCharSpace(0);
  }


  const lines =
    pdf.splitTextToSize(
      heading,
      PDF.pageWidth -
        PDF.marginLeft -
        PDF.marginRight
    );


  lines.forEach(
    (line) => {

      y =
        checkPage(
          pdf,
          y,
          7
        );


      pdf.text(
        line,
        PDF.marginLeft,
        y
      );


      y += 7;
    }
  );


  /*
     IMPORTANT:
     No underline.
     No horizontal line.
  */

  return y + 3;
};


/* =========================================================
   SMALL BOLD SUBHEADING
========================================================= */

const addSubHeading = (
  pdf,
  text,
  y
) => {

  const heading =
    cleanPdfText(text)
      .replace(
        /^#{1,6}\s*/,
        ""
      )
      .trim();


  if (!heading) {
    return y;
  }


  y =
    checkPage(
      pdf,
      y,
      9
    );


  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(
    PDF.subHeadingSize
  );

  pdf.setTextColor(
    35,
    37,
    30
  );


  if (
    typeof pdf.setCharSpace ===
    "function"
  ) {
    pdf.setCharSpace(0);
  }


  const lines =
    pdf.splitTextToSize(
      heading,
      PDF.pageWidth -
        PDF.marginLeft -
        PDF.marginRight
    );


  lines.forEach(
    (line) => {

      pdf.text(
        line,
        PDF.marginLeft,
        y
      );

      y += 5.5;
    }
  );


  return y + 1.5;
};


/* =========================================================
   SQUARE BULLET
========================================================= */

const addBullet = (
  pdf,
  text,
  y
) => {

  const cleaned =
    cleanPdfText(text);

  if (!cleaned) {
    return y;
  }


  y =
    checkPage(
      pdf,
      y,
      PDF.bulletLineHeight
    );


  const bulletX =
    PDF.marginLeft + 1;


  const textX =
    PDF.marginLeft + 7;


  /*
     Small square bullet.
  */

  pdf.setFillColor(
    30,
    32,
    26
  );


  pdf.rect(
    bulletX,
    y - 3,
    2.2,
    2.2,
    "F"
  );


  y =
    drawRichText(
      pdf,
      cleaned,
      textX,
      y,
      PDF.pageWidth -
        textX -
        PDF.marginRight
    );


  return y + 1.5;
};


/* =========================================================
   ARRAY SECTION
========================================================= */

const addArraySection = (
  pdf,
  title,
  data,
  y
) => {

  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {
    return y;
  }


  y =
    addMainHeading(
      pdf,
      title,
      y
    );


  data.forEach(
    (item) => {

      if (
        typeof item ===
        "string"
      ) {

        y =
          addBullet(
            pdf,
            item,
            y
          );

        return;
      }


      if (
        item &&
        typeof item ===
          "object"
      ) {

        const heading =
          item.term ||
          item.concept ||
          item.title;


        if (heading) {

          y =
            addSubHeading(
              pdf,
              heading,
              y
            );
        }


        const body =
          item.definition ||
          item.description ||
          item.content ||
          item.text;


        if (body) {

          y =
            addParagraph(
              pdf,
              body,
              y
            );
        }


        if (
          Array.isArray(
            item.points
          )
        ) {

          item.points.forEach(
            (point) => {

              y =
                addBullet(
                  pdf,
                  toText(point),
                  y
                );
            }
          );
        }
      }
    }
  );


  return y + 2;
};


/* =========================================================
   QUESTION SECTION
========================================================= */

const addQuestionSection = (
  pdf,
  title,
  data,
  y
) => {

  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {
    return y;
  }


  y =
    addMainHeading(
      pdf,
      title,
      y
    );


  data.forEach(
    (item, index) => {

      if (
        typeof item ===
        "string"
      ) {

        y =
          addBullet(
            pdf,
            item,
            y
          );

        return;
      }


      if (
        item &&
        typeof item ===
          "object"
      ) {

        const question =
          item.question;


        if (question) {

          y =
            addSubHeading(
              pdf,
              `Q${index + 1}. ${valueToText(
                question
              )}`,
              y
            );
        }


        if (item.term) {

          y =
            addSubHeading(
              pdf,
              item.term,
              y
            );
        }


        if (item.concept) {

          y =
            addSubHeading(
              pdf,
              item.concept,
              y
            );
        }


        if (
          item.definition
        ) {

          y =
            addParagraph(
              pdf,
              item.definition,
              y
            );
        }


        if (
          item.description
        ) {

          y =
            addParagraph(
              pdf,
              item.description,
              y
            );
        }


        if (
          Array.isArray(
            item.options
          )
        ) {

          item.options.forEach(
            (option) => {

              y =
                addBullet(
                  pdf,
                  valueToText(
                    option
                  ),
                  y
                );
            }
          );
        }


        if (item.answer) {

          y =
            addSubHeading(
              pdf,
              "Answer",
              y
            );


          y =
            addParagraph(
              pdf,
              item.answer,
              y
            );
        }
      }


      y += 1;
    }
  );


  return y;
};


/* =========================================================
   PAGE NUMBERS FOR ALL PAGES
========================================================= */

const addAllPageNumbers = (
  pdf
) => {

  const total =
    pdf.getNumberOfPages();


  for (
    let page = 1;
    page <= total;
    page++
  ) {

    pdf.setPage(page);

    addPageNumber(pdf);
  }
};


/* =========================================================
   SINGLE SECTION PDF
========================================================= */

export const downloadSectionPDF = ({
  title,
  subtitle = "",
  data,
  showAnswers = true,
  videoTitle = "NoteTube AI",
}) => {

  const pdf =
    new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });


  pdf.setProperties({
    title:
      `${videoTitle} - ${title}`,
    subject:
      "NoteTube AI Study Material",
    author: "NoteTube AI",
  });


  drawPageDesign(pdf);


  let y =
    PDF.marginTop;


  /*
     Small brand name.
  */

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(9);

  pdf.setTextColor(
    90,
    90,
    85
  );

  pdf.text(
    "NOTETUBE AI",
    PDF.marginLeft,
    y
  );


  y += 9;


  /*
     Main heading.
  */

  y =
    addMainHeading(
      pdf,
      title,
      y
    );


  /*
     Subtitle.
  */

  if (subtitle) {

    y =
      addParagraph(
        pdf,
        subtitle,
        y
      );
  }


  /*
     Content.
  */

  if (
    Array.isArray(data)
  ) {

    data.forEach(
      (item, index) => {

        y =
          addQuestionSection(
            pdf,
            "",
            [item],
            y
          );
      }
    );

  } else {

    y =
      addParagraph(
        pdf,
        valueToText(data),
        y
      );
  }


  addAllPageNumbers(pdf);


  const fileName =
    safeFileName(
      `${videoTitle}-${title}`
    );


  pdf.save(
    `${fileName}.pdf`
  );
};


/* =========================================================
   COMPLETE WORKSHEET PDF
========================================================= */

export const downloadCompletePDF = ({
  studyMaterial,
}) => {

  const pdf =
    new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });


  const videoTitle =
    studyMaterial?.title ||
    "NoteTube AI Study Material";


  const fileName =
    safeFileName(
      `${videoTitle}-Complete-Worksheet`
    );


  pdf.setProperties({
    title: videoTitle,
    subject:
      "AI Generated Study Material",
    author: "NoteTube AI",
    creator: "NoteTube AI",
  });


  drawPageDesign(pdf);


  let y =
    PDF.marginTop;


  /* =======================================================
     TITLE
  ======================================================= */

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(
    PDF.titleSize
  );

  pdf.setTextColor(
    25,
    27,
    22
  );


  if (
    typeof pdf.setCharSpace ===
    "function"
  ) {
    pdf.setCharSpace(0);
  }


  const titleLines =
    pdf.splitTextToSize(
      cleanPdfText(
        videoTitle
      ),
      PDF.pageWidth -
        PDF.marginLeft -
        PDF.marginRight
    );


  titleLines.forEach(
    (line) => {

      y =
        checkPage(
          pdf,
          y,
          9
        );


      pdf.text(
        line,
        PDF.marginLeft,
        y
      );


      y += 8;
    }
  );


  /*
     Small subtitle.
  */

  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(9);

  pdf.setTextColor(
    105,
    105,
    100
  );


  pdf.text(
    "AI Generated Study Material",
    PDF.marginLeft,
    y
  );


  y += 8;


  /* =======================================================
     OVERVIEW
  ======================================================= */

  if (
    studyMaterial?.overview
  ) {

    y =
      addMainHeading(
        pdf,
        "Overview",
        y
      );


    y =
      addParagraph(
        pdf,
        studyMaterial.overview,
        y
      );
  }


  /* =======================================================
     DETAILED CONTENT
  ======================================================= */

  if (
    studyMaterial?.detailed_content
  ) {

    y =
      addMainHeading(
        pdf,
        "Detailed Content",
        y
      );


    const detailed =
      cleanPdfText(
        studyMaterial.detailed_content
      );


    const paragraphs =
      detailed.split(
        /\n\s*\n/
      );


    paragraphs.forEach(
      (paragraph) => {

        const content =
          paragraph
            .replace(
              /\n/g,
              " "
            )
            .replace(
              /\s+/g,
              " "
            )
            .trim();


        if (!content) {
          return;
        }


        /*
           If the AI generated a short
           heading-like line, make it bold.
        */

        const looksLikeHeading =
          (
            content.length < 75 &&
            content.endsWith(":")
          ) ||
          /^#{1,6}\s+/.test(
            content
          );


        if (
          looksLikeHeading
        ) {

          y =
            addSubHeading(
              pdf,
              content.replace(
                /^#{1,6}\s*/,
                ""
              ).replace(
                /:$/,
                ""
              ),
              y
            );

        } else {

          y =
            addParagraph(
              pdf,
              content,
              y
            );
        }
      }
    );
  }


  /* =======================================================
     KEY CONCEPTS
  ======================================================= */

  y =
    addArraySection(
      pdf,
      "Key Concepts",
      studyMaterial?.key_concepts,
      y
    );


  /* =======================================================
     DEFINITIONS
  ======================================================= */

  y =
    addArraySection(
      pdf,
      "Definitions",
      studyMaterial?.definitions,
      y
    );


  /* =======================================================
     EXAMPLES
  ======================================================= */

  y =
    addArraySection(
      pdf,
      "Examples",
      studyMaterial?.examples,
      y
    );


  /* =======================================================
     IMPORTANT POINTS
  ======================================================= */

  y =
    addArraySection(
      pdf,
      "Important Points",
      studyMaterial?.important_points,
      y
    );


  /* =======================================================
     QUESTIONS
  ======================================================= */

  y =
    addQuestionSection(
      pdf,
      "Very Short Answer Questions",
      studyMaterial?.vsaq,
      y
    );


  y =
    addQuestionSection(
      pdf,
      "Short Answer Questions",
      studyMaterial?.saq,
      y
    );


  y =
    addQuestionSection(
      pdf,
      "Long Answer Questions",
      studyMaterial?.laq,
      y
    );


  y =
    addQuestionSection(
      pdf,
      "Multiple Choice Questions",
      studyMaterial?.mcq,
      y
    );


  y =
    addQuestionSection(
      pdf,
      "Fill in the Blanks",
      studyMaterial?.fill_in_the_blanks,
      y
    );


  /* =======================================================
     QUICK REVISION
  ======================================================= */

  if (
    studyMaterial?.quick_revision
  ) {

    y =
      addMainHeading(
        pdf,
        "Quick Revision",
        y
      );


    if (
      Array.isArray(
        studyMaterial.quick_revision
      )
    ) {

      studyMaterial.quick_revision.forEach(
        (point) => {

          y =
            addBullet(
              pdf,
              valueToText(
                point
              ),
              y
            );
        }
      );

    } else {

      y =
        addParagraph(
          pdf,
          studyMaterial.quick_revision,
          y
        );
    }
  }


  /* =======================================================
     PAGE NUMBERS
  ======================================================= */

  addAllPageNumbers(pdf);


  /* =======================================================
     DOWNLOAD
  ======================================================= */

  pdf.save(
    `${fileName}.pdf`
  );
};


/* =========================================================
   COMPLETE WORKSHEET - WORD
========================================================= */

export const downloadCompleteWord = async ({
  studyMaterial,
}) => {

  const videoTitle =
    studyMaterial?.title ||
    "NoteTube AI Study Material";


  const fileName =
    safeFileName(
      `${videoTitle}-Complete-Worksheet`
    );


  const children = [];


  children.push(
    new Paragraph({
      text: "NoteTube AI",
      heading:
        HeadingLevel.TITLE,
    })
  );


  children.push(
    new Paragraph({
      text: videoTitle,
      heading:
        HeadingLevel.HEADING_1,
    })
  );


  const addWordHeading = (
    text
  ) => {

    children.push(
      new Paragraph({
        text,
        heading:
          HeadingLevel.HEADING_2,
      })
    );
  };


  const addWordText = (
    text
  ) => {

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text:
              valueToText(
                text
              ),
          }),
        ],
      })
    );
  };


  /* OVERVIEW */

  addWordHeading(
    "Overview"
  );

  addWordText(
    studyMaterial?.overview
  );


  /* DETAILED CONTENT */

  addWordHeading(
    "Detailed Content"
  );

  addWordText(
    studyMaterial?.detailed_content
  );


  /* KEY CONCEPTS */

  if (
    Array.isArray(
      studyMaterial?.key_concepts
    ) &&
    studyMaterial.key_concepts.length
  ) {

    addWordHeading(
      "Key Concepts"
    );


    studyMaterial.key_concepts.forEach(
      (item, index) => {

        addWordText(
          questionToText(
            item,
            index,
            false
          )
        );
      }
    );
  }


  /* DEFINITIONS */

  if (
    Array.isArray(
      studyMaterial?.definitions
    ) &&
    studyMaterial.definitions.length
  ) {

    addWordHeading(
      "Definitions"
    );


    studyMaterial.definitions.forEach(
      (item, index) => {

        addWordText(
          questionToText(
            item,
            index,
            false
          )
        );
      }
    );
  }


  /* EXAMPLES */

  if (
    Array.isArray(
      studyMaterial?.examples
    ) &&
    studyMaterial.examples.length
  ) {

    addWordHeading(
      "Examples"
    );


    studyMaterial.examples.forEach(
      (item, index) => {

        addWordText(
          questionToText(
            item,
            index,
            false
          )
        );
      }
    );
  }


  /* IMPORTANT POINTS */

  if (
    Array.isArray(
      studyMaterial?.important_points
    ) &&
    studyMaterial
      .important_points
      .length
  ) {

    addWordHeading(
      "Important Points"
    );


    studyMaterial.important_points.forEach(
      (item, index) => {

        addWordText(
          questionToText(
            item,
            index,
            false
          )
        );
      }
    );
  }


  /* QUESTIONS */

  const sections = [
    [
      "VSAQ",
      studyMaterial?.vsaq,
    ],

    [
      "SAQ",
      studyMaterial?.saq,
    ],

    [
      "LAQ",
      studyMaterial?.laq,
    ],

    [
      "MCQ",
      studyMaterial?.mcq,
    ],

    [
      "Fill in the Blanks",
      studyMaterial?.fill_in_the_blanks,
    ],
  ];


  sections.forEach(
    ([sectionTitle, data]) => {

      if (
        Array.isArray(data) &&
        data.length
      ) {

        addWordHeading(
          sectionTitle
        );


        data.forEach(
          (item, index) => {

            addWordText(
              questionToText(
                item,
                index,
                true
              )
            );
          }
        );
      }
    }
  );


  /* QUICK REVISION */

  if (
    studyMaterial?.quick_revision
  ) {

    addWordHeading(
      "Quick Revision"
    );


    if (
      Array.isArray(
        studyMaterial.quick_revision
      )
    ) {

      studyMaterial.quick_revision.forEach(
        (point, index) => {

          addWordText(
            `${index + 1}. ${valueToText(
              point
            )}`
          );
        }
      );

    } else {

      addWordText(
        studyMaterial.quick_revision
      );
    }
  }


  /*
     IMPORTANT:
     Do not name this variable "document"
     because browser document is needed below.
  */

  const docxDocument =
    new Document({
      sections: [
        {
          children,
        },
      ],
    });


  const blob =
    await Packer.toBlob(
      docxDocument
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    window.document.createElement(
      "a"
    );


  link.href = url;

  link.download =
    `${fileName}.docx`;


  window.document.body.appendChild(
    link
  );


  link.click();


  window.document.body.removeChild(
    link
  );


  URL.revokeObjectURL(
    url
  );
};


/* =========================================================
   COMPLETE WORKSHEET - POWERPOINT
========================================================= */

export const downloadCompletePPT = ({
  studyMaterial,
}) => {

  const pptx =
    new pptxgen();


  pptx.layout =
    "LAYOUT_WIDE";


  pptx.author =
    "NoteTube AI";


  pptx.subject =
    "AI Generated Study Material";


  pptx.title =
    studyMaterial?.title ||
    "NoteTube AI Study Material";


  const videoTitle =
    studyMaterial?.title ||
    "NoteTube AI Study Material";


  const fileName =
    safeFileName(
      `${videoTitle}-Complete-Worksheet`
    );


  /* =======================================================
     TITLE SLIDE
  ======================================================= */

  const slide =
    pptx.addSlide();


  slide.addText(
    "NoteTube AI",
    {
      x: 1,
      y: 1.2,
      w: 11,
      h: 0.6,
      fontSize: 30,
      bold: true,
      align: "center",
    }
  );


  slide.addText(
    videoTitle,
    {
      x: 1,
      y: 2.2,
      w: 11,
      h: 1,
      fontSize: 24,
      align: "center",
    }
  );


  slide.addText(
    "AI Generated Study Material",
    {
      x: 1,
      y: 3.5,
      w: 11,
      h: 0.5,
      fontSize: 16,
      align: "center",
    }
  );


  /* =======================================================
     SECTION SLIDES
  ======================================================= */

  const addSectionSlides = (
    title,
    content
  ) => {

    if (!content) {
      return;
    }


    const text =
      valueToText(
        content
      );


    const chunks = [];


    for (
      let i = 0;
      i < text.length;
      i += 2500
    ) {

      chunks.push(
        text.substring(
          i,
          i + 2500
        )
      );
    }


    chunks.forEach(
      (
        chunk,
        index
      ) => {

        const newSlide =
          pptx.addSlide();


        newSlide.addText(
          index === 0
            ? title
            : `${title} (continued)`,
          {
            x: 0.6,
            y: 0.4,
            w: 12,
            h: 0.5,
            fontSize: 24,
            bold: true,
          }
        );


        newSlide.addText(
          chunk,
          {
            x: 0.7,
            y: 1.1,
            w: 11.8,
            h: 5.8,
            fontSize: 14,
            breakLine: false,
            valign: "top",
            margin: 0.08,
          }
        );
      }
    );
  };


  /* OVERVIEW */

  addSectionSlides(
    "Overview",
    studyMaterial?.overview
  );


  /* DETAILED CONTENT */

  addSectionSlides(
    "Detailed Content",
    studyMaterial?.detailed_content
  );


  /* KEY CONCEPTS */

  if (
    Array.isArray(
      studyMaterial?.key_concepts
    )
  ) {

    studyMaterial.key_concepts.forEach(
      (item, index) => {

        addSectionSlides(
          `Key Concept ${
            index + 1
          }`,
          questionToText(
            item,
            index,
            false
          )
        );
      }
    );
  }


  /* DEFINITIONS */

  if (
    Array.isArray(
      studyMaterial?.definitions
    )
  ) {

    studyMaterial.definitions.forEach(
      (item, index) => {

        addSectionSlides(
          `Definition ${
            index + 1
          }`,
          questionToText(
            item,
            index,
            false
          )
        );
      }
    );
  }


  /* EXAMPLES */

  if (
    Array.isArray(
      studyMaterial?.examples
    )
  ) {

    studyMaterial.examples.forEach(
      (item, index) => {

        addSectionSlides(
          `Example ${
            index + 1
          }`,
          questionToText(
            item,
            index,
            false
          )
        );
      }
    );
  }


  /* QUESTIONS */

  const sections = [
    [
      "VSAQ",
      studyMaterial?.vsaq,
    ],

    [
      "SAQ",
      studyMaterial?.saq,
    ],

    [
      "LAQ",
      studyMaterial?.laq,
    ],

    [
      "MCQ",
      studyMaterial?.mcq,
    ],

    [
      "Fill in the Blanks",
      studyMaterial?.fill_in_the_blanks,
    ],
  ];


  sections.forEach(
    ([sectionTitle, data]) => {

      if (
        Array.isArray(data)
      ) {

        data.forEach(
          (item, index) => {

            addSectionSlides(
              `${sectionTitle} - Question ${
                index + 1
              }`,
              questionToText(
                item,
                index,
                true
              )
            );
          }
        );
      }
    }
  );


  /* QUICK REVISION */

  if (
    studyMaterial?.quick_revision
  ) {

    addSectionSlides(
      "Quick Revision",

      Array.isArray(
        studyMaterial.quick_revision
      )
        ? studyMaterial.quick_revision
            .map(
              (
                point,
                index
              ) =>
                `${index + 1}. ${valueToText(
                  point
                )}`
            )
            .join("\n")
        : studyMaterial.quick_revision
    );
  }


  /* =======================================================
     SAVE
  ======================================================= */

  pptx.writeFile({
    fileName:
      `${fileName}.pptx`,
  });
};