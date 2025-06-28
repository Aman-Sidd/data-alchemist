"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
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
    <Card className="max-w-md w-full mx-auto">
      <CardContent className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            selectedFile
              ? "border-muted"
              : "border-gray-300 hover:border-primary"
          }`}
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
              <p className="mb-2">Drag & drop CSV/XLSX file here, or click to select</p>
              <span className="text-xs text-gray-500">Supported: .csv, .xlsx. Name must include entity type.</span>
            </>
          ) : (
            <div className="flex items-center justify-between">
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
          <div className="mt-3 text-sm text-muted-foreground">Parsing file...</div>
        )}
        {error && (
          <div className="mt-3 text-sm text-destructive">{error}</div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploader;