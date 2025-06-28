"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, UploadCloud } from "lucide-react";
import { parseFile } from "@/utils/parseData";

type EntityType = "clients" | "tasks" | "workers";

interface FileUploaderProps {
  onFileParsed: (entityType: EntityType, parsedData: any[]) => void;
}

const entityTypeFromName = (name: string): EntityType | null => {
  const lower = name.toLowerCase();
  if (lower.includes("client")) return "clients";
  if (lower.includes("task")) return "tasks";
  if (lower.includes("worker")) return "workers";
  return null;
};

const FileUploader: React.FC<FileUploaderProps> = ({ onFileParsed }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) return;
    const file = files[0];
    const entityType = entityTypeFromName(file.name);
    if (!entityType) {
      setError("File name must include 'clients', 'tasks', or 'workers'.");
      return;
    }
    setSelectedFile(file);
    setParsing(true);
    try {
      const { records } = await parseFile(file, entityType);
      onFileParsed(entityType, records);
    } catch (e) {
      setError("Failed to parse file.");
    }
    setParsing(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg px-3 py-3 text-center cursor-pointer transition-colors bg-muted/60 hover:bg-accent/60 flex flex-col items-center justify-center ${
          selectedFile
            ? "border-primary bg-primary/10"
            : "border-gray-300"
        }`}
        style={{ minHeight: 80 }} // Reduce min height for compactness
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        tabIndex={0}
        role="button"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv, .xlsx"
          className="hidden"
          onChange={handleChange}
          disabled={!!selectedFile}
        />
        {!selectedFile ? (
          <>
            <UploadCloud className="mx-auto mb-1 text-primary" size={22} />
            <span className="block font-medium text-sm mb-0.5 text-primary">
              Click or Drag & Drop
            </span>
            <span className="text-xs text-muted-foreground">
              CSV/XLSX, name must include{" "}
              <b>clients</b>, <b>tasks</b>, or <b>workers</b>
            </span>
          </>
        ) : (
          <div className="flex items-center justify-between w-full max-w-[90%] mx-auto text-sm">
            <span className="truncate">{selectedFile.name}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={e => {
                e.stopPropagation();
                removeFile();
              }}
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      {parsing && (
        <div className="mt-1 text-xs text-muted-foreground text-center">
          Parsing...
        </div>
      )}
      {error && (
        <div className="mt-1 text-xs text-destructive text-center">{error}</div>
      )}
    </div>
  );
};

export default FileUploader;