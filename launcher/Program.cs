using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace PDVLocalLauncher
{
    public class MainForm : Form
    {
        private Process serverProcess;
        private Label statusLabel;
        private Label urlLabel;
        private Button openAppButton;
        private Button stopButton;
        private string appDir;
        private int port = 3000;
        private string localUrl;
        private string lanUrl;
        private StringBuilder serverLogs = new StringBuilder();

        public MainForm()
        {
            appDir = ResolveAppDir();
            localUrl = "http://127.0.0.1:" + port;
            lanUrl = "http://" + GetLocalIPAddress() + ":" + port;

            Text = "PDV Local - Gerenciador";
            Size = new Size(430, 320);
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            BackColor = Color.FromArgb(248, 250, 252);
            Font = new Font("Segoe UI", 10F, FontStyle.Regular);

            var headerPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 68,
                BackColor = Color.FromArgb(5, 150, 105)
            };

            var titleLabel = new Label
            {
                Text = "PDV Local & Estoque",
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 15F, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(20, 12)
            };

            var subtitleLabel = new Label
            {
                Text = "Sistema de Frente de Caixa e Controle de Fiados",
                ForeColor = Color.FromArgb(209, 250, 229),
                Font = new Font("Segoe UI", 9F, FontStyle.Regular),
                AutoSize = true,
                Location = new Point(22, 40)
            };

            headerPanel.Controls.Add(titleLabel);
            headerPanel.Controls.Add(subtitleLabel);

            statusLabel = new Label
            {
                Text = "Iniciando servidor local...",
                ForeColor = Color.FromArgb(30, 41, 59),
                Font = new Font("Segoe UI", 10.5F, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(22, 85)
            };

            urlLabel = new Label
            {
                Text = "Acesso no PC: " + localUrl + "\r\nAcesso no Celular (Wi-Fi): " + lanUrl,
                ForeColor = Color.FromArgb(71, 85, 105),
                Font = new Font("Segoe UI", 9.5F, FontStyle.Regular),
                AutoSize = true,
                Location = new Point(22, 115)
            };

            openAppButton = new Button
            {
                Text = "Abrir Frente de Caixa (PDV)",
                Size = new Size(370, 48),
                Location = new Point(22, 165),
                BackColor = Color.FromArgb(5, 150, 105),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 11F, FontStyle.Bold),
                Enabled = false,
                Cursor = Cursors.Hand
            };
            openAppButton.FlatAppearance.BorderSize = 0;
            openAppButton.Click += (s, e) => OpenAppWindow();

            stopButton = new Button
            {
                Text = "Encerrar Sistema",
                Size = new Size(370, 36),
                Location = new Point(22, 224),
                BackColor = Color.FromArgb(226, 232, 240),
                ForeColor = Color.FromArgb(51, 65, 85),
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            stopButton.FlatAppearance.BorderSize = 0;
            stopButton.Click += (s, e) => Close();

            Controls.Add(headerPanel);
            Controls.Add(statusLabel);
            Controls.Add(urlLabel);
            Controls.Add(openAppButton);
            Controls.Add(stopButton);

            Shown += async (s, e) => await StartServerAsync();
            FormClosing += (s, e) => StopServer();
        }

        private string ResolveAppDir()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            if (File.Exists(Path.Combine(baseDir, @"node_modules\next\dist\bin\next")))
            {
                return baseDir;
            }
            string fallback = @"C:\Users\marci\OneDrive\Desktop\extensao";
            if (Directory.Exists(fallback))
            {
                return fallback;
            }
            return baseDir;
        }

        private string FindNodeExe()
        {
            string[] candidates = new[]
            {
                @"C:\Program Files\nodejs\node.exe",
                @"C:\Program Files (x86)\nodejs\node.exe"
            };
            foreach (var c in candidates)
            {
                if (File.Exists(c)) return c;
            }
            return "node.exe";
        }

        private async Task StartServerAsync()
        {
            string errorMsg = null;

            await Task.Run(() =>
            {
                try
                {
                    if (IsServerReady())
                    {
                        return;
                    }

                    string nodeExe = FindNodeExe();
                    string nextBin = Path.Combine(appDir, @"node_modules\next\dist\bin\next");
                    bool hasBuild = Directory.Exists(Path.Combine(appDir, ".next"));
                    string subCmd = hasBuild ? "start" : "dev";

                    var psi = new ProcessStartInfo
                    {
                        FileName = nodeExe,
                        Arguments = "\"" + nextBin + "\" " + subCmd + " -p " + port,
                        WorkingDirectory = appDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                    };

                    serverProcess = new Process { StartInfo = psi };
                    serverProcess.OutputDataReceived += (s, e) => { if (e.Data != null) serverLogs.AppendLine(e.Data); };
                    serverProcess.ErrorDataReceived += (s, e) => { if (e.Data != null) serverLogs.AppendLine(e.Data); };
                    serverProcess.Start();
                    serverProcess.BeginOutputReadLine();
                    serverProcess.BeginErrorReadLine();

                    for (int i = 0; i < 50; i++)
                    {
                        if (serverProcess.HasExited)
                        {
                            errorMsg = "Servidor encerrou inesperadamente: " + serverLogs.ToString();
                            return;
                        }
                        if (IsServerReady())
                        {
                            return;
                        }
                        Thread.Sleep(250);
                    }

                    if (!IsServerReady())
                    {
                        errorMsg = "Tempo limite ao iniciar servidor.";
                    }
                }
                catch (Exception ex)
                {
                    errorMsg = ex.Message;
                }
            });

            if (errorMsg != null)
            {
                statusLabel.Text = "Erro: " + errorMsg;
                statusLabel.ForeColor = Color.Red;
                return;
            }

            statusLabel.Text = "● Sistema Online e Pronto!";
            statusLabel.ForeColor = Color.FromArgb(5, 150, 105);
            openAppButton.Enabled = true;

            OpenAppWindow();
        }

        private bool IsServerReady()
        {
            try
            {
                using (var tcp = new TcpClient())
                {
                    var result = tcp.BeginConnect("127.0.0.1", port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(250));
                    if (!success) return false;
                    tcp.EndConnect(result);
                }

                var req = (HttpWebRequest)WebRequest.Create(localUrl);
                req.Timeout = 1500;
                using (var resp = (HttpWebResponse)req.GetResponse())
                {
                    return resp.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        private void OpenAppWindow()
        {
            try
            {
                string profileDir = Path.Combine(Path.GetTempPath(), "PDVLocalAppProfile");
                string[] browserPaths = new[]
                {
                    @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                    @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                    @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                    @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
                };

                foreach (var browser in browserPaths)
                {
                    if (File.Exists(browser))
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = browser,
                            Arguments = "--app=" + localUrl + " --window-size=430,860 --user-data-dir=\"" + profileDir + "\"",
                            UseShellExecute = true
                        });
                        return;
                    }
                }

                Process.Start(new ProcessStartInfo
                {
                    FileName = localUrl,
                    UseShellExecute = true
                });
            }
            catch
            {
                Process.Start(localUrl);
            }
        }

        private void StopServer()
        {
            try
            {
                if (serverProcess != null && !serverProcess.HasExited)
                {
                    var killProc = Process.Start(new ProcessStartInfo
                    {
                        FileName = "taskkill",
                        Arguments = "/F /T /PID " + serverProcess.Id,
                        CreateNoWindow = true,
                        UseShellExecute = false
                    });
                    if (killProc != null)
                    {
                        killProc.WaitForExit(2000);
                    }
                }
            }
            catch { }
        }

        private string GetLocalIPAddress()
        {
            try
            {
                foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
                {
                    if (ni.OperationalStatus == OperationalStatus.Up &&
                        ni.NetworkInterfaceType != NetworkInterfaceType.Loopback)
                    {
                        foreach (var ua in ni.GetIPProperties().UnicastAddresses)
                        {
                            if (ua.Address.AddressFamily == AddressFamily.InterNetwork)
                            {
                                return ua.Address.ToString();
                            }
                        }
                    }
                }
            }
            catch { }
            return "127.0.0.1";
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
