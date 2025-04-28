import { useState } from "react"
import { Upload, X, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"

interface FileUploadProps {
  onFileChange: (file: File | null) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
}

export function FileUpload({ onFileChange, accept = ".csv,.txt,.xlsx", maxSize = 5, className }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files[0]
    handleFile(droppedFile)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    handleFile(selectedFile || null)
  }

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) return

    if (selectedFile.size > maxSize * 1024 * 1024) {
      alert(`File size should be less than ${maxSize}MB`)
      return
    }

    setFile(selectedFile)
    onFileChange(selectedFile)
  }

  const removeFile = () => {
    setFile(null)
    onFileChange(null)
  }

  return (
    <div className={className}>
      {!file ? (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
            dragActive
              ? "border-primary/50 bg-primary/5"
              : "border-muted-foreground/25 hover:bg-muted/50",
            className
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="mb-1 font-medium">Drag and drop your file here or</p>
            <p className="text-sm text-muted-foreground">
              Click to browse (max {maxSize}MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary/70" />
            <div className="flex flex-col">
              <p className="font-medium truncate max-w-[200px]">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)}MB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={removeFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
