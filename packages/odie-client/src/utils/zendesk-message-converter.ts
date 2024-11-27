import { __ } from '@wordpress/i18n';
import { Message, MessageRole, MessageType, ZendeskMessage } from '../types';

// Format markdown to support images attachments
function prepareMarkdownImage( imgUrl: string ): string {
	return `![Image](${ imgUrl })`;
}

function convertUrlsToMarkdown( text: string ): string {
	const urlRegex = /\b((https?:\/\/)?(www\.)?[\w.-]+\.[a-z]{2,}(\.[a-z]{2,})*(\/[^\s]*)?)/gi;

	return text.replace( urlRegex, ( match ) => {
		let url = match;
		if ( ! /^https?:\/\//i.test( url ) ) {
			url = `https://${ url }`;
		}
		try {
			const validUrl = new URL( url );
			return `[${ match }](${ validUrl.href })`;
		} catch {
			return match;
		}
	} );
}

// Format markdown to support file attachments, returns a link to download the file.
function createDownloadableMarkdownLink( url: string, AttachmentTitle: string ): string {
	const fileName = url.split( '/' ).pop()?.split( '?' )[ 0 ];
	return `[${ AttachmentTitle } ${ fileName }](${ url })`;
}

function getContentMessage( message: ZendeskMessage ): string {
	let messageContent = '';
	switch ( message.type ) {
		case 'image':
			if ( message.mediaUrl ) {
				messageContent = prepareMarkdownImage( message.mediaUrl );
			}
			break;
		case 'text':
			messageContent = convertUrlsToMarkdown( message.text );
			break;
		case 'file':
			if ( message.mediaUrl ) {
				messageContent = createDownloadableMarkdownLink(
					message.mediaUrl,
					message.altText || __( 'Attachment' )
				);
			}
			break;
		default:
			// We don't support it yet return generic message.
			messageContent = __( 'Message content not supported' );
	}
	return messageContent;
}

export const zendeskMessageConverter: ( message: ZendeskMessage ) => Message = ( message ) => {
	return {
		content: getContentMessage( message ),
		role: ( [ 'user', 'business' ].includes( message.role )
			? message.role
			: 'user' ) as MessageRole,
		type: message.type as MessageType,
	};
};
