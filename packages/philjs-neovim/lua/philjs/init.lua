local M = {}

M.setup = function(opts)
  opts = opts or {}
  
  -- Basic configuration for PhilJS projects
  vim.api.nvim_create_autocmd({"BufRead", "BufNewFile"}, {
    pattern = "*.phil",
    callback = function()
      vim.bo.filetype = "typescriptreact" -- Treat as TSX for now
      vim.opt_local.commentstring = "{/* %s */}"
    end
  })
  
  -- command to start philjs dev server
  vim.api.nvim_create_user_command("PhilJSDev", function()
    vim.cmd("term npm run dev")
  end, {})
end

return M
