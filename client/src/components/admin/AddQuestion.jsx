import React, { useState, useMemo, useRef } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/themes/prism-tomorrow.css";
import * as XLSX from 'xlsx';
import {   FaFileUpload, FaFileExcel } from "react-icons/fa";

import {
  FaPython, FaJs, FaJava, FaCheckCircle,
  FaSpinner
} from "react-icons/fa";
import { BsCodeSlash } from "react-icons/bs";

import Alert from "../shared/Alert";
import api from "../../services/api";

// Define supported languages
const SUPPORTED_LANGUAGES = {
  python3: {
    name: "Python", prism: languages.python, apiValue: "python3",
    icon: <FaPython className="text-blue-400" />,
    stub: `def solution():\n  print("Hello from Python")\n\nsolution()`
  },
  javascript: {
    name: "JavaScript", prism: languages.js, apiValue: "javascript",
    icon: <FaJs className="text-yellow-400" />,
    stub: `function solution() {\n  console.log("Hello from JavaScript");\n}\n\nsolution();`
  },
  java: {
    name: "Java", prism: languages.java, apiValue: "java",
    icon: <FaJava className="text-red-500" />,
    stub: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello from Java");\n  }\n}`
  },
  cpp17: {
    name: "C++", prism: languages.clike, apiValue: "cpp17",
    icon: <BsCodeSlash className="text-blue-600" />,
    stub: `#include <iostream>\n\nint main() {\n  std::cout << "Hello from C++";\n  return 0;\n}`
  }
};


const AddQuestion = () => {
  // State setup
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("mcq");
  const [options, setOptions] = useState({ A: "", B: "", C: "", D: "" });
  const [correctOption, setCorrectOption] = useState("A");
  const [language, setLanguage] = useState("python3");
  const [solution, setSolution] = useState(SUPPORTED_LANGUAGES.python3.stub);
  const [expectedOutput, setExpectedOutput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "info", details: [] });
  const fileInputRef = useRef(null);
  const currentLang = useMemo(() => SUPPORTED_LANGUAGES[language], [language]);

   const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    // Handle non-Excel files by guiding the user
    if (['pdf', 'doc', 'docx'].includes(fileExtension)) {
        setMessage({
            text: "Unsupported File Type",
            type: "error",
            details: ["Direct import from PDF or Word is not supported due to formatting inconsistencies. Please use the provided Excel template for reliable bulk uploads."]
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        return;
    }
    
    // Proceed with Excel file processing
    if (['xlsx', 'xls'].includes(fileExtension)) {
        setIsSubmitting(true);
        setMessage({ text: "Processing Excel file...", type: "info", details: [] });

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                
                await parseAndSubmitBulkQuestions(json);

            } catch (error) {
                setMessage({ text: `An unexpected error occurred: ${error.message}`, type: "error", details: [] });
                console.error(error);
                setIsSubmitting(false);
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.onerror = () => {
            setMessage({ text: "Failed to read the file.", type: "error", details: [] });
            setIsSubmitting(false);
        };
        reader.readAsArrayBuffer(file);
    } else {
        setMessage({ text: "Invalid file type. Please select an Excel (.xlsx, .xls) file.", type: "error", details: [] });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };

  const parseAndSubmitBulkQuestions = async (questions) => {
    const payloads = [];
    const parsingErrors = [];

    questions.forEach((q, index) => {
        const rowNum = index + 2;
        if (!q.QuestionText || !q.Type) {
            parsingErrors.push(`Row ${rowNum}: Missing required fields 'QuestionText' or 'Type'.`);
            return;
        }

        const payload = {
            question_text: q.QuestionText,
            type: q.Type.toLowerCase(),
        };

        if (payload.type === 'mcq') {
            if (!q.OptionA || !q.OptionB || !q.OptionC || !q.OptionD || !q.CorrectOption) {
                parsingErrors.push(`Row ${rowNum}: MCQ questions require all Option fields and a CorrectOption.`);
                return;
            }
            payload.options = JSON.stringify([q.OptionA, q.OptionB, q.OptionC, q.OptionD]);
            payload.correct_option = q.CorrectOption.toUpperCase();
        } else if (payload.type === 'code') {
            if (!q.Language || !q.Solution || !q.ExpectedOutput) {
                parsingErrors.push(`Row ${rowNum}: Code questions require Language, Solution, and ExpectedOutput.`);
                return;
            }
            payload.language = q.Language;
            payload.solution = q.Solution;
            payload.expected_output = q.ExpectedOutput;
        } else {
            parsingErrors.push(`Row ${rowNum}: Invalid question type '${q.Type}'. Use 'mcq' or 'code'.`);
            return;
        }
        payloads.push(payload);
    });

    if (parsingErrors.length > 0) {
        setMessage({ text: "File parsing failed. Please fix the errors and try again.", type: "error", details: parsingErrors });
        setIsSubmitting(false);
        return;
    }
    
    try {
        await api.post("/admin/questions-bulk", { questions: payloads });
        setMessage({ text: `Successfully added ${payloads.length} questions!`, type: "success", details: [] });
    } catch (err) {
        setMessage({ text: "Failed to submit questions to the database.", type: "error", details: err.response?.data?.errors || [] });
    } finally {
        setIsSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const data = [
        { QuestionText: "What is 2+2?", Type: "mcq", OptionA: "3", OptionB: "4", OptionC: "5", OptionD: "6", CorrectOption: "B", Language: "", Solution: "", ExpectedOutput: "" },
        { QuestionText: "Write a Python function to print 'Hello'", Type: "code", OptionA: "", OptionB: "", OptionC: "", OptionD: "", CorrectOption: "", Language: "python3", Solution: "def hello():\n  print('Hello')\nhello()", ExpectedOutput: "Hello" }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    XLSX.writeFile(workbook, "Question_Upload_Template.xlsx");
  };
  const resetForm = () => {
    setQuestionText("");
    setQuestionType("mcq");
    setOptions({ A: "", B: "", C: "", D: "" });
    setCorrectOption("A");
    setLanguage("python3");
    setSolution(SUPPORTED_LANGUAGES.python3.stub);
    setExpectedOutput("");
    setCodeVerified(false);
    setMessage({ text: "", type: "info" });
  };

  const handleRunCode = async () => {
    setIsRunningCode(true);
    setMessage({ text: "", type: "info" });

    const normalize = (text) => (text || "").replace(/\r\n/g, "\n").trim();

    try {
      const res = await api.post("/exam/run", {
        language: currentLang.apiValue,
        code: solution
      });

      const output = normalize(res.data.output);
      const expected = normalize(expectedOutput);

      if (output === expected) {
        setCodeVerified(true);
        setMessage({ text: "Code verified successfully!", type: "success" });
      } else {
        setCodeVerified(false);
        setMessage({ text: `Verification failed. Expected: "${expected}", Got: "${output}"`, type: "error" });
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Error running code.", type: "error" });
      setCodeVerified(false);
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (questionType === "code" && !codeVerified) {
      setMessage({ text: "Please verify your code before submitting.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      question_text: questionText,
      type: questionType,
      ...(questionType === "code" && {
        language,
        solution,
        expected_output: expectedOutput
      }),
      ...(questionType === "mcq" && {
        options: JSON.stringify(Object.values(options)),
        correct_option: correctOption
      }),
    };

    try {
      await api.post("/admin/questions", payload);
      setMessage({ text: "Question added successfully!", type: "success" });
      resetForm();
    } catch {
      setMessage({ text: "Failed to add question.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 border-b pb-3">Bulk Upload Questions</h2>
        <p className="text-gray-600 mb-4">
          Quickly add multiple questions by uploading a formatted file. 
          <strong className="text-gray-800"> Using the Excel template is the recommended method for reliable uploads.</strong>
        </p>
        <div className="flex items-center gap-4">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                className="hidden"
                // ✨ UPDATED: Accept all requested file types
                accept=".xlsx, .xls, .pdf, .doc, .docx"
                disabled={isSubmitting}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-green-600 text-green-600 font-semibold rounded-md shadow-sm hover:bg-green-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
                {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : <FaFileUpload className="mr-2" />}
                {isSubmitting ? 'Processing...' : 'Choose File'}
            </button>
            <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center px-4 py-2 border border-transparent bg-blue-500 text-white font-semibold rounded-md shadow-sm hover:bg-blue-600"
            >
                <FaFileExcel className="mr-2" />
                Download Excel Template
            </button>
        </div>
        {message.text && <div className="mt-4"><Alert message={message.text} type={message.type} details={message.details || []} /></div>}
      </div><br></br>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Add New Question</h2>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setQuestionType("mcq")}
          className={`flex-1 py-2 rounded-lg font-semibold transition ${
            questionType === "mcq" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Multiple Choice
        </button>
        <button
          onClick={() => setQuestionType("code")}
          className={`flex-1 py-2 rounded-lg font-semibold transition ${
            questionType === "code" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Coding Problem
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Alert message={message.text} type={message.type} />

        {/* Question Text */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">Question Text</label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            required
            className="w-full border p-2 rounded bg-gray-50"
            rows={4}
          />
        </div>

        {/* MCQ Section */}
        {questionType === "mcq" && (
          <div className="space-y-4">
            {Object.keys(options).map((opt) => (
              <div key={opt}>
                <label className="block font-medium text-gray-700 mb-1">Option {opt}</label>
                <input
                  type="text"
                  value={options[opt]}
                  onChange={(e) => setOptions({ ...options, [opt]: e.target.value })}
                  required
                  className="w-full border p-2 rounded"
                />
              </div>
            ))}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Correct Option</label>
              <select
                value={correctOption}
                onChange={(e) => setCorrectOption(e.target.value)}
                className="w-full border p-2 rounded"
              >
                {Object.keys(options).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Coding Section */}
        {questionType === "code" && (
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setSolution(SUPPORTED_LANGUAGES[e.target.value].stub);
                  setCodeVerified(false);
                }}
                className="w-full border p-2 rounded"
              >
                {Object.entries(SUPPORTED_LANGUAGES).map(([key, { name }]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Solution Code</label>
              <Editor
                value={solution}
                onValueChange={(code) => {
                  setSolution(code);
                  setCodeVerified(false);
                }}
                highlight={(code) => highlight(code, currentLang.prism, language)}
                padding={10}
                className="bg-gray-900 text-white font-mono text-sm rounded min-h-[150px]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Expected Output</label>
              <textarea
                value={expectedOutput}
                onChange={(e) => {
                  setExpectedOutput(e.target.value);
                  setCodeVerified(false);
                }}
                required
                className="w-full border p-2 rounded bg-gray-50 font-mono"
                rows={3}
                placeholder="Enter the exact output here..."
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunningCode}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                {isRunningCode ? (
                  <FaSpinner className="animate-spin inline" />
                ) : (
                  "Run & Verify"
                )}
              </button>
              {codeVerified && (
                <div className="text-green-600 flex items-center gap-2 font-medium">
                  <FaCheckCircle /> Code Verified
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {isSubmitting ? "Submitting..." : "Add Question"}
        </button>
      </form>
    </div>
  );
};

export default AddQuestion;
