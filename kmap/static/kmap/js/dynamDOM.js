DynamDOM();

function DynamDOM() {
    var dom = MakeDOM(null);

    try {
        // Создайте инструкцию по обработке, предназначенную для xml.
        var node = dom.createProcessingInstruction("xml",
            "version='1.0'");
        dom.appendChild(node);
        node = null;

        // Create the root element.
        var root = dom.createElement("root");

        // Создайте атрибут "created" для корневого элемента и назначьте
        // символьные данные "using dom" в качестве значения атрибута.
        var attr = dom.createAttribute("created");
        attr.value = "using dom";
        root.setAttributeNode(attr);
        attr = null;

        // Add the root element to the DOM instance.
        dom.appendChild(root);

        // Insert a newline + tab.
        root.appendChild(dom.createTextNode("\n\t"));

        // Создайте дополнительные узлы и добавьте их к только что созданному корневому элементу.

        // Add a text node as <node1>.
        node = dom.createElement("node1");
        node.text = "some character data";
        root.appendChild(node);

        // Add a newline + tab.
        root.appendChild(dom.createTextNode("\n\t"));

        // Add a CDATA section as <node2>.
        node = null;
        node = dom.createElement("node2");
        var cd = dom.createCDATASection("some mark-up text");
        node.appendChild(cd);
        cd = null;
        root.appendChild(node);

        // Add a newline + tab.
        frag.appendChild(dom.createTextNode("\n\t"));
        root.appendChild(node);
        frag = null;
        node = null;

        // Add a newline.
        root.appendChild(dom.createTextNode("\n"));

        // Save the XML document to a file.
        dom.save("dynamDom.xml");

        root = null;
        dom = null;
        console.log(dom)
    } catch (e) {
        alert(e.description);
    }

}

function MakeDOM(progID) {
    if (progID == null) {
        progID = "blay";
    }

    var dom;
    try {
        dom = new ActiveXObject(progID);
        dom.async = false;
        dom.validateOnParse = false;
        dom.resolveExternals = false;
    } catch (e) {
        alert(e.description);
    }
    return dom;
}

// function alert(str) {
//     WScript.Echo(str);
// }