module main

import vweb
import json
import mysql

struct App {
	vweb.Context
}

fn main() {
	app := App{}
	vweb.run(app, 3000)
}

