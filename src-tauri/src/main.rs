// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let daemon_mode = std::env::args().any(|argument| argument == "--daemon");
    smoothy_lib::run_with_options(smoothy_lib::RunOptions { daemon_mode })
}
