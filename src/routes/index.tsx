import {
  component$,
  useStore,
  useSignal,
  $,
  useStylesScoped$,
  useOnWindow,
} from "@builder.io/qwik";
import { type DocumentHead } from "@builder.io/qwik-city";

import Manipulator from "./main";
import Styles from "./styles.css?inline";
export const head: DocumentHead = {
  title: "Colorify",
  meta: [
    {
      name: "description",
      content: "Colorify - Quantize your Images",
    },
  ],
};
export default component$(() => {
  useStylesScoped$(Styles);

  const modes = [
    { val: 2, id: "bw", text: "Black & White" },
    { val: 1, id: "lumi", text: "By Luminance" },
    { val: 0, id: "near", text: "Nearest Color" },
  ];
  const resModes = [
    { val: 1, id: "original", text: "Original" },
    { val: 0, id: "optimized", text: "Optimized" },
  ];
  const loaded = useSignal(false);
  const loop = useSignal(false);
  const finished = useSignal(false);

  const rmode = useSignal(0);
  const resmode = useSignal(0);
  const store = useStore({
    palette: [
      "#003049",
      "#d62827",
      "#f77f00",
      "#fdbf49",
      "#eae2b7",

      "#173f5f",
      "#20639b",
      "#3caea3",
      "#f6d55c",
      "#ed553b",
    ],
    loaded,
    loop,
    finished,
    rmode,
    resmode,
  });

  const removeColor = $((e: any) => {
    const col = e.target.getAttribute("data-color");
    const index = store.palette.indexOf(col);
    // only splice array when item is found
    if (index > -1) store.palette.splice(index, 1); // 2nd parameter means remove one item only
  });
  const addColor = $((e: any) => {
    const col = e.target.value;

    store.palette.push(col);
    // only splice array when item is found
  });
  const handleUpload = $((e: any) => {
    if (e.target.files.length > 0) {
      const imageElement = document.getElementById(
        "sample",
      ) as HTMLImageElement;

      imageElement.src = URL.createObjectURL(e.target.files[0]);
      finished.value = false;
    }
    e.target.value = null;
  });
  const handleRadio = $(() => {
    const checkedInput = document.querySelector(
      'input[name="rmode"]:checked',
    ) as HTMLInputElement;
    rmode.value = parseInt(checkedInput.value);
  });
  const handleSize = $(() => {
    const checkedInput = document.querySelector(
      'input[name="resmode"]:checked',
    ) as HTMLInputElement;
    resmode.value = parseInt(checkedInput.value);
  });

  useOnWindow(
    "load",
    $(() => {
      const manipulator = new Manipulator("sample", store);
      const startButton = document.getElementById(
        "start-btn",
      ) as HTMLFormElement;

      startButton.addEventListener("click", () => {
        console.log("starting");
        manipulator.init();
        manipulator.animate();
      });
    }),
  );

  return (
    <>
      <section id="pal-sect">
        <h2>Palette</h2>
        <ul>
          {store.palette.map((col) => (
            <li
              class="colordiv"
              data-color={col}
              onClick$={removeColor}
              style={`background-color:${col}`}
              key={col + Math.random()}
            >
              {col}
            </li>
          ))}

          <label for="colorinput" id="colorlabel">
            <input
              class="none"
              id="colorinput"
              type="color"
              onChange$={addColor}
            />
          </label>
        </ul>
      </section>
      <section id="control-sect">
        <div>
          <h3>Mode</h3>
          <ul class="container radio-div">
            {modes.map((m) => (
              <div key={m.id} class="radio-div">
                <input
                  type="radio"
                  id={m.id}
                  name="rmode"
                  checked
                  value={m.val}
                  onChange$={handleRadio}
                />
                <label for={m.id}>{m.text}</label>
              </div>
            ))}
          </ul>
        </div>
        <div>
          <h3>Resolution</h3>
          <ul class="container radio-div">
            {resModes.map((m) => (
              <div key={m.id}>
                <input
                  type="radio"
                  id={m.id}
                  name="resmode"
                  checked
                  value={m.val}
                  onChange$={handleSize}
                />
                <label for={m.id}>{m.text}</label>
              </div>
            ))}
          </ul>
          <p>
            Original resolution is not recommended if dimentions are too big
          </p>
        </div>
        <input
          class="none"
          type="file"
          id="img"
          accept="image/*"
          onChange$={handleUpload}
        />
        <button id="input-btn">
          <label for="img">Select a image</label>
        </button>

        <button class={!loaded.value && "none"} id="start-btn">
          Start
        </button>
      </section>
      <div>
        <img id="sample" src="/sample.png" alt="sample-image" />

        <h2 class={!finished.value && "none"}>
          <a href="#" download="output.png" id="download-sample">
            Download
          </a>
        </h2>
      </div>
    </>
  );
});
