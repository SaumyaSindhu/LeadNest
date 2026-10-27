(() => {
  const script = document.currentScript;

  if (!script) {
    console.error("LeadNest: Unable to identify the embed script.");
    return;
  }

  const widgetId = new URL(script.src).searchParams.get("id");
  const apiBase = new URL(script.src).origin;

  if (!widgetId) {
    console.error("LeadNest: Missing widget ID in the script URL.");
    return;
  }

  const container = document.createElement("div");
  container.className = "leadnest-widget";
  container.style.cssText =
    "font-family:Arial,sans-serif;max-width:420px;margin:16px 0;color:#222;";

  script.insertAdjacentElement("afterend", container);

  function showMessage(message, isError = false) {
    const notice = document.createElement("p");
    notice.textContent = message;
    notice.style.cssText = `margin-top:12px;color:${isError ? "#b42318" : "#067647"};`;
    container.appendChild(notice);
  }

  async function initializeWidget() {
    try {
      const response = await fetch(
        `${apiBase}/api/public/widgets/${encodeURIComponent(widgetId)}/config`,
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load this form.");
      }

      const widget = result.widget;
      const form = document.createElement("form");
      form.style.cssText = "display:grid;gap:12px;";

      const heading = document.createElement("h3");
      heading.textContent = widget.title;
      heading.style.margin = "0 0 4px";
      container.appendChild(heading);

      const inputs = [];

      for (const field of widget.fields) {
        const group = document.createElement("div");
        group.style.cssText = "display:grid;gap:6px;";

        const label = document.createElement("label");
        label.textContent = field.label;
        label.htmlFor = `ln-${widget.id}-${field.name}`;

        const input =
          field.type === "textarea"
            ? document.createElement("textarea")
            : document.createElement("input");

        input.id = label.htmlFor;
        input.name = field.name;
        if (field.type !== "textarea") {
          input.type = field.type;
        }
        input.required = field.required === true;

        if (field.placeholder) {
          input.placeholder = field.placeholder;
        }

        input.style.cssText =
          "box-sizing:border-box;width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font:inherit;";

        group.append(label, input);
        form.appendChild(group);
        inputs.push(input);
      }

      // Honeypot for basic bot detection; server-side checks are added later.
      const honeypot = document.createElement("input");
      honeypot.type = "text";
      honeypot.name = "_company_website";
      honeypot.autocomplete = "off";
      honeypot.tabIndex = -1;
      honeypot.setAttribute("aria-hidden", "true");
      honeypot.style.cssText =
        "position:absolute;left:-10000px;width:1px;height:1px;";
      form.appendChild(honeypot);

      const button = document.createElement("button");
      button.type = "submit";
      button.textContent = widget.buttonText || "Submit";
      button.style.cssText =
        "padding:11px 16px;border:0;border-radius:6px;background:#2457d6;color:white;font:inherit;cursor:pointer;";
      form.appendChild(button);

      const status = document.createElement("p");
      status.setAttribute("role", "status");
      form.appendChild(status);

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        status.textContent = "";
        button.disabled = true;

        const data = {};
        for (const input of inputs) {
          data[input.name] = input.value.trim();
        }

        try {
          const submissionResponse = await fetch(`${apiBase}/api/submissions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              widgetId: widget.id,
              data,
              sourceUrl: window.location.href,
              _company_website: honeypot.value,
            }),
          });

          const submissionResult = await submissionResponse.json();

          if (!submissionResponse.ok || !submissionResult.success) {
            throw new Error(
              submissionResult.message ||
                "Submission failed. Please try again.",
            );
          }

          form.reset();
          status.textContent = "Thank you! Your submission was received.";
        } catch (error) {
          status.textContent =
            error.message || "Something went wrong. Please try again.";
        } finally {
          button.disabled = false;
        }
      });

      container.appendChild(form);
    } catch (error) {
      showMessage(error.message || "Unable to load the LeadNest form.", true);
    }
  }

  initializeWidget();
})();
