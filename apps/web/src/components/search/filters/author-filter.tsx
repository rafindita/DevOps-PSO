import { Input } from "@scholar-seek/ui/components/input";
import { useEffect, useState } from "react";

interface AuthorFilterProps {
	onChange: (value: string) => void;
	value: string;
}

export function AuthorFilter({ value, onChange }: AuthorFilterProps) {
	const [local, setLocal] = useState(value);

	useEffect(() => {
		setLocal(value);
	}, [value]);

	function handleBlur() {
		if (local !== value) {
			onChange(local);
		}
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			onChange(local);
		}
	}

	return (
		<Input
			className="h-8 text-sm"
			onBlur={handleBlur}
			onChange={(e) => setLocal(e.target.value)}
			onKeyDown={handleKeyDown}
			placeholder="Search by author..."
			value={local}
		/>
	);
}
