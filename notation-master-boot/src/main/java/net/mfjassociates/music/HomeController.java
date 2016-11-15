package net.mfjassociates.music;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class HomeController {
	
	@RequestMapping(value="/", produces=MediaType.TEXT_HTML_VALUE+"; charset=UTF-8")
	public String hello() {
		return "music";
	}

}
