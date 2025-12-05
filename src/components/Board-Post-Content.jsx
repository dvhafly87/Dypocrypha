import { useParams, useNavigate } from 'react-router-dom';

export default function BoardPostContent() {
    const { boardId } = useParams();
    const { postId } = useParams();
  return (
    <div>
        <h2>Board Post Content</h2>
        {boardId && <p>Board ID: {boardId}</p>}
        {postId && <p>Post ID: {postId}</p>}
    </div>
  );
}