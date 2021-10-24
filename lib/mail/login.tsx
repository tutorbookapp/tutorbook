import { Footer, Message, P, fontFamily } from 'lib/mail/components';
import send from 'lib/mail/send';

export default function mail(email: string, location: string, link: string): Promise<void> {
  return send({
    to: [{ email }],
    subject: `Login Confirmation (${location})`,
    template: (
      <Message>
        <P style={{ marginTop: '0px !important' }}>Hi there,</P>
        <P>
          We just received a login attempt from {location}. To complete the
          login process, simply click the button below:
        </P>
        <br />
        <table width='100%'>
          <tbody>
            <tr>
              <td align='center' style={{ padding: '0' }}>
                <div>
                  <a
                    href={link}
                    style={{
                      fontFamily,
                      borderRadius: '8px',
                      color: '#ffffff !important',
                      lineHeight: '56px',
                      fontSize: '16px',
                      textDecoration: 'none',
                      backgroundColor: '#000000',
                      display: 'inline-block',
                      fontWeight: 500,
                      width: '200px',
                      textAlign: 'center'
                    }}
                  >
                    CONFIRM LOGIN 
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <br />
        <P>
          If you didn&apos;t attempt to log in but received this email, or if
          the location doesn&apos;t match, please ignore this email. If you are
          concerned about your account&apos;s safety, please reply to this email
          to get in touch with us.
        </P>
        <Footer />
      </Message>
    ),
  });
}
