class DocumentSocketHandler {
  constructor(io, socket) {
    this.io = io;
    this.socket = socket;
  }

  register() {
    // Domain B will register document patch socket events here.
  }
}

export { DocumentSocketHandler };
export default DocumentSocketHandler;
