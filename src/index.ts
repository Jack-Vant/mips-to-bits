const div_infiles = document.querySelector<HTMLDivElement>("#infiles")!;

let hlc = 0;

function highlightDropzone(e: DragEvent) {
    hlc++;
    div_infiles.classList.remove("highlight-1", "highlight-2");
    if ((e.target as HTMLElement).id == "infiles")
        div_infiles.classList.add("highlight-1");
    else
        div_infiles.classList.add("highlight-2");
}

function unhighlightDropzone() {
    if (--hlc == 0)
        div_infiles.classList.remove("highlight-1", "highlight-2");
}

document.body.addEventListener("dragenter", highlightDropzone);
document.body.addEventListener("dragleave", unhighlightDropzone);

const files: { [name: string]: File } = {};

function removeFile(div: HTMLDivElement, file_name: string) {
    delete files[file_name];
    div.remove();
}

function createIcon(iconName: string) {
    const xmlns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(xmlns, "svg");
    svg.setAttributeNS(null, "class", "icon");
    const use = document.createElementNS(xmlns, "use");
    use.setAttributeNS(null, "href", `./svgs/${iconName}.svg#main`);
    svg.appendChild(use);
    return svg;
}

function appendSrcFileElement(file_name: string) {
    const div_bloc = document.createElement("div");
    div_bloc.className = "bloc";
    const div_file = document.createElement("div");
    div_file.className = "file file-src";
    const span = document.createElement("span");
    span.textContent = file_name;
    const btn = document.createElement("button");
    btn.className = "btn btn-remove";
    btn.title = "Remove file";
    btn.addEventListener("click", () => removeFile(div_bloc, file_name));
    const icon = createIcon("trash-alt");
    btn.appendChild(icon);
    div_file.appendChild(span);
    div_file.appendChild(document.createTextNode("\n"));
    div_file.appendChild(btn);
    div_bloc.appendChild(div_file);
    div_infiles.appendChild(div_bloc);
}

function pushSrcFiles(new_files: FileList | undefined | null) {
    if (new_files instanceof FileList)
        for (const file of new_files) {
            if (files[file.name] != undefined)
                continue;
            files[file.name] = file;
            appendSrcFileElement(file.name);
        }
}

div_infiles.addEventListener("dragover", e => e.preventDefault());
div_infiles.addEventListener("drop", (e) => {
    e.preventDefault();
    const dt_files = e.dataTransfer?.files;
    pushSrcFiles(dt_files);
    unhighlightDropzone();
});

const input_files = document.querySelector<HTMLInputElement>("#input_files")!;
input_files.addEventListener("change", () => { pushSrcFiles(input_files.files); });
input_files.disabled = false;

const btn_files = document.querySelector<HTMLButtonElement>("#btn_files")!;
btn_files.addEventListener("click", () => input_files.click());
btn_files.disabled = false;

import * as MtB from "./MtB.js";

const div_outfiles = document.querySelector<HTMLDivElement>("div#outfiles")!;
const ul_errList = document.querySelector<HTMLUListElement>("ul#errlist")!;

let urls: string[] = [];

function appendOutFileElement(cf: File) {
    const div_bloc = document.createElement("div");
    div_bloc.className = "bloc";
    const div_file = document.createElement("div");
    div_file.className = "file file-out";
    const a = document.createElement("a");
    const url = window.URL.createObjectURL(cf);
    urls.push(url); // <-- !
    a.href = url;
    a.download = cf.name;
    a.text = cf.name;
    const icon = createIcon("check-square");
    div_file.appendChild(a);
    div_file.appendChild(document.createTextNode("\n"));
    div_file.appendChild(icon);
    div_bloc.appendChild(div_file);
    div_outfiles.appendChild(div_bloc);
}

function appendError(error: string) {
    const li = document.createElement("li");
    li.textContent = error;
    ul_errList.appendChild(li);
}

async function convertFile(f: File, size: number, zf: boolean, zFill: string) {
    const result = MtB.convert(f.name, await f.text(), size);
    if (result.errors.length > 0) {
        result.errors.forEach(err => appendError(err));
    } else {
        let lines = result.lines;
        if (zf)
            lines = lines.map(l => l.concat(zFill));
        const cf = new File(lines, `${f.name.match(/.+(?=\.)/)?.[0]}.txt`, { type: "text/plain" });
        appendOutFileElement(cf);
    }
}

async function run() {
    ul_errList.replaceChildren(); // Clear error list
    div_outfiles.replaceChildren(); // Clear outfiles
    for (const url of urls) // Clear urls
        window.URL.revokeObjectURL(url);
    urls = [];

    const size = Number.parseInt(document.querySelector<HTMLSelectElement>("#size")!.value);
    const zFill = "\n".padStart(size + 1, "0").repeat(3);
    const zf = document.querySelector<HTMLInputElement>("#zf")!.checked;

    for (const f in files) {
        try {
            await convertFile(files[f], size, zf, zFill);
        } catch (err) {
            appendError(err);
        }
    }
}

const button_run = document.querySelector<HTMLButtonElement>("button#run_btn")!;
button_run.addEventListener("click", run);
button_run.disabled = false;