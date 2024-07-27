import * as fs from "node:fs";
import { dirname, join } from "node:path";
import { styleText } from "node:util";

namespace BaganFs {
	/* TYPES */
	export interface WriteFileOpts {
		filePath: string;
		data: string | NodeJS.ArrayBufferView;
		callback?: fs.NoParamCallback;
	}
	export interface AppendFileOpts {
		/**
		 * path/to/file want to append
		 */
		filePath: fs.PathLike;
		/**
		 * content to append
		 */
		content: string | Uint8Array;
	}
	export type E = "change" | "close" | "error";
	export type L<T extends E> = T extends "change"
		? (eventType: string, filename: string | Buffer) => void
		: T extends "close"
			? () => void
			: T extends "error"
				? (error: Error) => void
				: undefined;

	/* ----------------------------------------------------------------------------------------------- */
	/**
	 * Closes the file descriptor.
	 *
	 * @param fd - The file descriptor to be closed.
	 * @throws {Error} - If an error occurs while closing the file descriptor.
	 */
	export function close_fd(fd: number): void {
		fs.close(fd, (err) => {
			if (err) throw err;
		});
	}
	export const is_file = (f_path: fs.PathLike): boolean =>
		!!fs.lstatSync(f_path).isFile();
	export const is_dir = (f_path: fs.PathLike): boolean =>
		!!fs.lstatSync(f_path).isDirectory();
	export const get_size = (f_path: fs.PathLike): number =>
		fs.lstatSync(f_path).size;

	export function fs_copy(
		src: string | URL,
		des: string | URL,
		callback?: (error: NodeJS.ErrnoException | null) => void,
	) {
		const cb =
			callback ??
			((error: NodeJS.ErrnoException | null) => {
				if (error) {
					console.log(styleText("magenta", error.message));
				}
			});

		fs.cp(src, des, cb);
		console.log(styleText(["italic", "green"], `Copied ${src} to ${des}`));
	}
	/**
	 * Creates a directory at the specified path.
	 *
	 * @param path - The path where the directory will be created.
	 */
	export function mk_dir(path: fs.PathLike): void {
		fs.mkdir(path, { recursive: true }, (err) => {
			if (err) throw err;
		});
	}
	/**
	 * Cleans the specified directory by removing all files within it.
	 *
	 * @param dirPath - The path of the directory to clean.
	 */
	export function clean_dir(dirPath: string) {
		const files = fs.readdirSync(dirPath);
		for (const file of files) {
			fs.rmSync(join(dirPath, file));
		}
	}
	/**
	 * Deletes a file at the specified file path if it exists.
	 *
	 * @param filePath - The path to the file to be deleted.
	 */
	export function delet_file(filePath: fs.PathLike) {
		if (is_file(filePath)) {
			try {
				fs.rmSync(filePath);
			} catch (error) {
				console.log(error);
			}
		}
	}
	/**
	 * Writes data to a file specified by the filePath.
	 * If the directory path does not exist, it creates the directory.
	 *
	 * @param filePath - The path to the file where the data will be written.
	 * @param data - The data to be written to the file.
	 * @param callback - An optional callback function to be executed after writing the file.
	 */
	export function write_file({
		filePath,
		data,
		callback,
	}: WriteFileOpts): void {
		const cb: fs.NoParamCallback = callback ?? (() => true);

		const directoryPath = dirname(filePath);
		if (!fs.existsSync(directoryPath)) {
			mk_dir(directoryPath);
		}

		fs.writeFile(filePath, data, cb);
	}
	/**
	 * Reads a file from the specified file path.
	 *
	 * @param filePath - The path to the file to be read.
	 * @returns An object containing the buffer, Uint8Array, and text content of the file.
	 * @throws Throws an error if there is an issue reading the file.
	 */
	export function read_file(filePath: fs.PathLike) {
		if (!fs.existsSync(filePath) || !is_file(filePath)) {
			console.warn(
				styleText("yellow", `${filePath} does not exists or not a file`),
			);
			return;
		}

		const buf = fs.readFileSync(filePath);
		const u8ary = new Uint8Array(buf);
		const text = buf.toString("utf-8");
		return {
			buf,
			u8ary,
			text,
		};
	}
	/**
	 * Appends content to a file at the specified path.
	 *
	 * @param filePath - The path to the file to append content to.
	 * @param content - The content to append to the file.
	 */
	export function append_file({ filePath, content }: AppendFileOpts): void {
		fs.open(filePath, "a", (err, fd) => {
			if (err) throw err;
			try {
				fs.appendFile(fd, content, "utf8", (err) => {
					close_fd(fd);
					if (err) throw err;
				});
			} catch (err) {
				close_fd(fd);
				throw err;
			}
		});
	}
	/**
	 * Writes content to a file at the specified path.
	 * If the file already exists, a message is logged.
	 *
	 * @param filePath - The path to the file to write to.
	 * @param content - The content to write to the file.
	 */
	export function fs_write(filePath: fs.PathLike, content: string) {
		const e = fs.existsSync(filePath);
		if (e) {
			console.log(styleText("yellow", `${filePath} already exists.`));
		}
		fs.open(filePath, "w", (err, fd) => {
			if (err) throw err;
			try {
				fs.writeFile(fd, content, (err) => {
					close_fd(fd);
					if (err) throw err;
				});
			} catch (error) {
				close_fd(fd);
				throw error;
			}
		});
	}

	/**
	 *
	 * @param fileName
	 * @returns
	 */
	export function fs_watch(fileName: fs.PathLike) {
		const watcher = fs.watch(fileName, { recursive: true });
		const start = (event: E, listener: L<E>) => {
			watcher.on(event, listener);
			let cbs = false;
			if (!cbs && event === "change") {
				console.log(styleText("yellow", "Watcher is starting...."));
				setTimeout(() => {
					cbs = false;
				}, 3000);
			}
		};

		const close = () => watcher.close();
		let cb_restart = false;
		const restart = (timeout = 1000) => {
			if (!cb_restart) {
				cb_restart = true;
				setTimeout(() => {
					console.log(styleText("green", "Watcher restarted...."));
					start("change", () => true);
				}, timeout);
				setTimeout(() => {
					cb_restart = false;
				}, 3000);
			}
		};

		return {
			close,
			restart,
			start,
		};
	}
}

const baganfs = BaganFs;

export default baganfs;
