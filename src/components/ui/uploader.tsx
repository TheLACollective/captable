"use client";

import { uploadFile } from "@/common/uploads";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/trpc/react";
import React, { useCallback, useState } from "react";
import {
  useDropzone,
  type DropzoneOptions,
  type FileWithPath,
} from "react-dropzone";
import { Button } from "./button";

import { type RouterOutputs } from "@/trpc/shared";

export type UploadReturn = RouterOutputs["bucket"]["create"];

type DocumentUploadDropzone = Omit<
  DropzoneOptions,
  "noClick" | "noKeyboard" | "onDrop"
>;

type UploadProps =
  | {
      shouldUpload?: true;
      onSuccess?: (data: UploadReturn) => void | Promise<void>;
    }
  | {
      shouldUpload: false;
      onSuccess?: (data: FileWithPath[]) => void | Promise<void>;
    };

type Props = {
  header?: React.ReactNode;

  // should be companyPublicId or memberId or userId
  identifier: string;

  keyPrefix: string;

  multiple?: boolean;
} & DocumentUploadDropzone &
  UploadProps;

export function Uploader({
  header,
  identifier,
  keyPrefix,
  onSuccess,
  multiple = false,
  shouldUpload = true,
  ...rest
}: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const { mutateAsync } = api.bucket.create.useMutation();

  const onDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    try {
      if (!multiple && acceptedFiles.length > 1) {
        toast({
          variant: "destructive",
          title: "Files exceeded",
          description: "Only one file is allowed for upload",
        });
        return;
      }

      setUploading(true);

      if (shouldUpload) {
        for (const file of acceptedFiles) {
          const { key, mimeType, name, size } = await uploadFile(file, {
            identifier,
            keyPrefix,
          });

          const data = await mutateAsync({ key, mimeType, name, size });

          if (onSuccess) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
            await onSuccess(data as any);
          }

          toast({
            variant: "default",
            title: "🎉 Successfully uploaded",
            description: "Your document(s) has been uploaded.",
          });
        }
      } else {
        if (onSuccess) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
          await onSuccess(acceptedFiles as any);
        }
        toast({
          variant: "default",
          title: "🎉 Successfully uploaded",
          description: "Your document(s) has been uploaded.",
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Please reload the page and try again later.",
      });
    } finally {
      setUploading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { getRootProps, getInputProps, open } = useDropzone({
    ...rest,
    // Disable click and keydown behavior
    noClick: true,
    noKeyboard: true,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    onDrop,
  });

  return (
    <section className="w-full">
      <div
        {...getRootProps({ className: "dropzone" })}
        className="flex w-full flex-col items-center justify-center  rounded-md border border-dashed border-border px-5 py-10"
      >
        {header}
        <input {...getInputProps()} multiple={multiple} />
        <p className="text-center text-neutral-500">
          Drop & drop, or select a file to upload
        </p>
        <Button
          onClick={open}
          variant={"default"}
          className="mt-5"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Select a file"}
        </Button>
      </div>
    </section>
  );
}

export default Uploader;
