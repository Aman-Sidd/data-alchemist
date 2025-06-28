"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, UploadCloud, Info } from "lucide-react";
import * as XLSX from "xlsx";
import { parseFile } from "@/utils/parseData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type EntityType = "clients" | "tasks" | "workers";

interface FileUploaderProps {
  onFileParsed: (entityType: EntityType, parsedData: any[]) => void;
}

const SHEET_PATTERNS: Record<EntityType, RegExp> = {
  clients: /client/i,
  tasks: /task/i,
  workers: /worker/i,
};

interface UploadedFile {
  file: File;
  entities: EntityType[];
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileParsed }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [fileToRemove, setFileToRemove] = useState<UploadedFile | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Helper to check if an entity is already uploaded
  const isEntityUploaded = (entity: EntityType) =>
    uploadedFiles.some((uf) => uf.entities.includes(entity));

  // Main file handler
  const handleFiles = async (files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) return;
    setParsing(true);

    // Only allow up to 3 files
    const filesArr = Array.from(files).slice(0, 3 - uploadedFiles.length);

    for (const file of filesArr) {
      let foundEntities: EntityType[] = [];

      if (file.name.endsWith(".xlsx")) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });

        // Try to find sheets for each entity
        for (const [entity, pattern] of Object.entries(SHEET_PATTERNS) as [EntityType, RegExp][]) {
          if (isEntityUploaded(entity)) continue; // Skip if already uploaded
          const sheetName = workbook.SheetNames.find((name) => pattern.test(name));
          if (sheetName) {
            const sheet = workbook.Sheets[sheetName];
            const records: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            if (records.length > 0) {
              onFileParsed(entity, records);
              foundEntities.push(entity);
            }
          }
        }

        // If no recognizable sheets found, try to guess entity from filename
        if (foundEntities.length === 0) {
          const lower = file.name.toLowerCase();
          let entityType: EntityType | null = null;
          if (!isEntityUploaded("clients") && lower.includes("client")) entityType = "clients";
          else if (!isEntityUploaded("tasks") && lower.includes("task")) entityType = "tasks";
          else if (!isEntityUploaded("workers") && lower.includes("worker")) entityType = "workers";

          if (entityType) {
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const records: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
            if (records.length > 0) {
              onFileParsed(entityType, records);
              foundEntities.push(entityType);
            }
          }
        }
      } else if (file.name.endsWith(".csv")) {
        // Try to guess entity type from file name
        const lower = file.name.toLowerCase();
        let entityType: EntityType | null = null;
        if (!isEntityUploaded("clients") && lower.includes("client")) entityType = "clients";
        else if (!isEntityUploaded("tasks") && lower.includes("task")) entityType = "tasks";
        else if (!isEntityUploaded("workers") && lower.includes("worker")) entityType = "workers";

        if (!entityType) {
          setError("CSV file name must include 'clients', 'tasks', or 'workers'.");
          continue;
        }
        const { records } = await parseFile(file, entityType);
        onFileParsed(entityType, records);
        foundEntities.push(entityType);
      } else {
        setError("Unsupported file type. Please upload a CSV or XLSX file.");
        continue;
      }

      if (foundEntities.length > 0) {
        setUploadedFiles((prev) => [...prev, { file, entities: foundEntities }]);
      } else {
        setError("No recognizable sheets or filename found (clients, tasks, or workers).");
      }
    }
    setParsing(false);
  };

  // Remove file and clear its data
  const confirmRemoveFile = () => {
    if (fileToRemove) {
      for (const entity of fileToRemove.entities) {
        onFileParsed(entity, []);
      }
      setUploadedFiles((prev) => prev.filter((uf) => uf.file !== fileToRemove.file));
      setFileToRemove(null);
    }
    setShowRemoveDialog(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so user can re-upload the same file if needed
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">Upload Data</span>
        <button
          type="button"
          className="ml-2 text-muted-foreground hover:text-primary focus:outline-none"
          onClick={() => setShowHelp(true)}
          aria-label="Help"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
      {/* Always show the drop area */}
      <div
        className={`border-2 border-dashed rounded-lg px-3 py-3 text-center cursor-pointer transition-colors bg-muted/60 hover:bg-accent/60 flex flex-col items-center justify-center border-gray-300`}
        style={{ minHeight: 80 }}
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
          multiple
        />
        <UploadCloud className="mx-auto mb-1 text-primary" size={22} />
        <span className="block font-medium text-sm mb-0.5 text-primary">
          Click or Drag & Drop
        </span>
        <span className="text-xs text-muted-foreground">
          Upload up to 3 files. Each file can contain <b>clients</b>, <b>tasks</b>, or <b>workers</b> data (by sheet or filename).
        </span>
      </div>

      {/* Chips for uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 px-3">
          {uploadedFiles.map((uf) => (
            <div
              key={uf.file.name}
              className="flex items-center bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-medium shadow"
            >
              <span className="truncate max-w-[150px]">{uf.file.name}</span>
              <span className="ml-2 text-muted-foreground">
                [{uf.entities.join(", ")}]
              </span>
              <button
                type="button"
                className="ml-2 text-muted-foreground hover:text-destructive focus:outline-none"
                onClick={() => {
                  setFileToRemove(uf);
                  setShowRemoveDialog(true);
                }}
                aria-label="Remove file"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Remove confirmation dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove File</DialogTitle>
          </DialogHeader>
          <div>
            Are you sure you want to remove this file and clear its data from the app?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoveFile}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How to Upload Data</DialogTitle>
          </DialogHeader>
          <div className="text-sm space-y-2">
            <ul className="list-disc pl-5">
              <li>
                You can upload <b>up to 3 files</b> in total.
              </li>
              <li>
                Each file can be an Excel (.xlsx) or CSV (.csv).
              </li>
              <li>
                Excel files can contain one or more sheets. Sheets are recognized by the presence of <b>client</b>, <b>task</b>, or <b>worker</b> in their name (case-insensitive).
              </li>
              <li>
                CSV files are recognized by their filename containing <b>client</b>, <b>task</b>, or <b>worker</b>.
              </li>
              <li>
                You can upload a single file with all data, or separate files for each entity.
              </li>
              <li>
                To replace or remove a file, click the <X className="inline w-3 h-3" /> on its chip.
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowHelp(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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