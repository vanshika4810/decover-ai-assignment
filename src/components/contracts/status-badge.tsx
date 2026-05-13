import { Badge } from "@/components/ui/badge";

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  if (status === "completed") {
    return <Badge variant="default">Completed</Badge>;
  }

  if (status === "processing") {
    return <Badge variant="secondary">Processing</Badge>;
  }

  return <Badge variant="outline">Uploaded</Badge>;
}
