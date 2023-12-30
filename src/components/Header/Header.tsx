import { component$, useStylesScoped$ } from "@builder.io/qwik";
import Styles from "./styles.css?inline";
export default component$(() => {
  useStylesScoped$(Styles);
  return (
    <header>
      <div>Colorify</div>
    </header>
  );
});
