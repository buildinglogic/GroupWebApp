
// delete todo list
$("ul.highlight-ul").on("click", ".delete", function(event) {
	$(this).parent().fadeOut(500, function() { // parent() get the parent object
		$(this).remove();
	});
	event.stopPropagation(); // jQuery method to stop event bubling
});

// append new todo list
$("input[type=text]").keypress(function(e) {
	if(e.which === 13) {
		var todoText = $(this).val(); // grab the input string
		$(this).val("");
		// append new li at the end of ul
		$("ul").append("<li><span class=\"delete\"><i class=\"fas fa-trash-alt\"></i></span> " + todoText + "</li>");
	}
});

$("#toggleForm").click(function() {
	$("input[type=text]").fadeToggle();
});
