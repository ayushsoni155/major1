import React from "react";

import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
} from "@/components/base-node";
import { TableBody, TableRow, TableCell } from "@/components/ui/table";

export const DatabaseSchemaNodeHeader = ({
  children
}) => {
  return (
    <BaseNodeHeader
      className="rounded-tl-md rounded-tr-md bg-secondary p-2 text-center text-sm text-muted-foreground">
      <h2>{children}</h2>
    </BaseNodeHeader>
  );
};

export const DatabaseSchemaNodeBody = ({
  children
}) => {
  return (
    <BaseNodeContent className="p-0">
      <table className="border-spacing-10 overflow-visible">
        <TableBody>{children}</TableBody>
      </table>
    </BaseNodeContent>
  );
};

export const DatabaseSchemaTableRow = ({
  children,
  className
}) => {
  return (
    <TableRow className={`relative text-xs ${className || ""}`}>
      {children}
    </TableRow>
  );
};

export const DatabaseSchemaTableCell = ({
  className,
  children
}) => {
  return <TableCell className={className}>{children}</TableCell>;
};

export const DatabaseSchemaNode = ({
  className,
  children
}) => {
  return <BaseNode className={className}>{children}</BaseNode>;
};
