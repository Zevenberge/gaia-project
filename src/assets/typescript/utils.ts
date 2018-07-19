export function showError(error: string) {
  $("#errors").html(`<div class='alert alert-danger alert-dismissible fade show' role='alert'>${error}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`);
}

export function removeError() {
  $("#errors").html('');
}