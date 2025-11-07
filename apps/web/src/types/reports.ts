//TODO: delete this and replace with shared report types
export type Report ={
    id: string;
    title: string;
    status: string;
}

export type ReportsListProps = {
    canAddReport?: boolean | null;
    onAddReport?: () => void;
}